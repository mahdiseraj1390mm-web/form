#!/usr/bin/env python3
"""
BelHagh VM Backup Setup & Automation Script
Connects to safaan@192.168.2.60 via SSH, sets up Python backup script with psycopg2,
configures hourly cron job (0 * * * *), verifies database backup execution,
validates gzip integrity and tests 12-file retention policy.
"""

import os
import sys
import time
import paramiko

# Reconfigure stdout/stderr for UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

VM_HOST = "192.168.2.60"
VM_PORT = 22
VM_USER = "safaan"
VM_PASS = "safaan@12345"

LOCAL_SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

def run_ssh_cmd(ssh, cmd, sudo_pass=None, check=True):
    print(f"\n⚡ Executing: {cmd}")
    if sudo_pass:
        full_cmd = f"echo '{sudo_pass}' | sudo -S -p '' {cmd}"
    else:
        full_cmd = cmd
    stdin, stdout, stderr = ssh.exec_command(full_cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(f"  [STDOUT]:\n{out}")
    if err and "password" not in err.lower():
        print(f"  [STDERR]:\n{err}")
    if check and exit_status != 0:
        raise RuntimeError(f"Command '{cmd}' failed with code {exit_status}\nError: {err}")
    return exit_status, out, err

def main():
    print(f"🔌 Connecting to {VM_USER}@{VM_HOST}:{VM_PORT}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VM_HOST, port=VM_PORT, username=VM_USER, password=VM_PASS, timeout=15)
    print("✅ SSH Connection established.")

    try:
        # Step 1: Check and install python3-psycopg2
        print("\n🔍 Checking for python3-psycopg2 on VM...")
        code, out, _ = run_ssh_cmd(ssh, "python3 -c 'import psycopg2; print(\"OK\")' || true", check=False)
        if "OK" not in out:
            print("📦 Installing python3-psycopg2 via apt...")
            run_ssh_cmd(ssh, "DEBIAN_FRONTEND=noninteractive apt-get update -y", sudo_pass=VM_PASS)
            run_ssh_cmd(ssh, "DEBIAN_FRONTEND=noninteractive apt-get install -y python3-psycopg2", sudo_pass=VM_PASS)
            print("✅ python3-psycopg2 installed.")
        else:
            print("✅ python3-psycopg2 is already installed and functional.")

        # Step 2: Ensure directories exist
        print("\n📁 Ensuring directories exist...")
        run_ssh_cmd(ssh, "mkdir -p /home/safaan/scripts /home/safaan/backups/belhagh_db")

        # Step 3: Upload backup_neon.py and backup_neon.sh via SFTP
        print("\n📝 Uploading backup scripts to VM...")
        sftp = ssh.open_sftp()
        
        local_py = os.path.join(LOCAL_SCRIPTS_DIR, "backup_neon.py")
        with open(local_py, "r", encoding="utf-8") as f:
            py_content = f.read().replace("\r\n", "\n")
        with sftp.open("/home/safaan/scripts/backup_neon.py", "w") as remote_f:
            remote_f.write(py_content)

        local_sh = os.path.join(LOCAL_SCRIPTS_DIR, "backup_neon.sh")
        with open(local_sh, "r", encoding="utf-8") as f:
            sh_content = f.read().replace("\r\n", "\n")
        with sftp.open("/home/safaan/scripts/backup_neon.sh", "w") as remote_f:
            remote_f.write(sh_content)

        sftp.close()
        run_ssh_cmd(ssh, "chmod +x /home/safaan/scripts/backup_neon.py /home/safaan/scripts/backup_neon.sh")
        print("✅ Scripts uploaded and permissions set.")

        # Step 4: Configure cron job for safaan (hourly: 0 * * * *)
        print("\n⏰ Configuring hourly crontab (0 * * * *)...")
        cron_line = "0 * * * * /bin/bash /home/safaan/scripts/backup_neon.sh >> /home/safaan/backups/cron_output.log 2>&1"
        cron_check_cmd = f"""
(crontab -l 2>/dev/null | grep -v "backup_neon" || true; echo "{cron_line}") | crontab -
"""
        run_ssh_cmd(ssh, cron_check_cmd)
        _, current_crontab, _ = run_ssh_cmd(ssh, "crontab -l")
        print(f"Current Crontab:\n{current_crontab}")

        # Step 5: Test backup run
        print("\n🚀 Executing backup script on VM...")
        run_ssh_cmd(ssh, "/bin/bash /home/safaan/scripts/backup_neon.sh")

        # Step 6: Verify backup archive integrity
        print("\n🧪 Verifying generated backup archive...")
        _, files_list, _ = run_ssh_cmd(ssh, "ls -lh /home/safaan/backups/belhagh_db/")
        print(f"Backups in folder:\n{files_list}")

        latest_file_cmd = "ls -1t /home/safaan/backups/belhagh_db/belhagh_backup_*.sql.gz | head -n 1"
        _, latest_file, _ = run_ssh_cmd(ssh, latest_file_cmd)
        if latest_file:
            print(f"Testing gzip integrity on {latest_file}...")
            run_ssh_cmd(ssh, f"gzip -t {latest_file}")
            print("✅ Gzip archive is structurally sound and intact.")

            print("\nInspecting SQL contents from archive:")
            run_ssh_cmd(ssh, f"zcat {latest_file} | head -n 30")

        # Step 7: Test Retention Policy with simulated files
        print("\n🧪 Testing 12-file retention policy with simulated files...")
        test_script = """
for i in {01..15}; do
    touch -d "$i hours ago" /home/safaan/backups/belhagh_db/belhagh_backup_simulated_${i}.sql.gz
done
"""
        run_ssh_cmd(ssh, test_script)
        _, count_before, _ = run_ssh_cmd(ssh, "ls -1 /home/safaan/backups/belhagh_db/belhagh_backup_*.sql.gz | wc -l")
        print(f"File count before retention run: {count_before}")

        # Run python retention pass
        run_ssh_cmd(ssh, "/usr/bin/python3 /home/safaan/scripts/backup_neon.py")
        _, count_after, _ = run_ssh_cmd(ssh, "ls -1 /home/safaan/backups/belhagh_db/belhagh_backup_*.sql.gz | wc -l")
        print(f"File count after retention run: {count_after}")
        assert int(count_after) == 12, f"Expected 12 files, got {count_after}"
        print("✅ Retention policy verified: exactly 12 backups retained!")

        # Step 8: Final Log Check
        print("\n📜 Checking backup log output:")
        run_ssh_cmd(ssh, "tail -n 25 /home/safaan/backups/backup.log")

        print("\n🎉 ALL VM BACKUP CONFIGURATIONS & TESTS COMPLETED WITH 100% SUCCESS!")

    finally:
        ssh.close()
        print("🔒 SSH Connection closed.")

if __name__ == "__main__":
    main()
