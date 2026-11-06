const fs = require('fs');

// Patch vertical-bar-chart.tsx
{
  const file = 'src/components/analytics/vertical-bar-chart.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace bottom box and add floating tooltip inside the bar container
  const oldTooltipRegex = /\{\/\* نوار راهنمای تعاملی کوچک در زیر نمودار در صورت هاور \*\/\}[\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*\);\s*\};/;
  
  // Find where hovered bar renders and inject floating tooltip
  const barInnerTarget = `<div className="mt-2 text-center w-full px-0.5">`;
  const barInnerRepl = `{/* کادر شناور راهنما (Tooltip) - دقیقاً هنگام مکث موس زیر/بالای ستون ظاهر می‌شود و هنگام خروج ناپدید می‌گردد */}
                {isHovered && (
                  <div className="absolute -top-14 z-30 pointer-events-none bg-slate-900/95 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl border border-slate-700/80 whitespace-nowrap flex flex-col items-center animate-in fade-in zoom-in-95 duration-100">
                    <span className="font-bold">{item.label}</span>
                    <span className="font-mono font-black text-amber-300">
                      {toPersianDigits(item.value)} {unit} {item.percentage !== undefined ? \`(\${toPersianDigits(item.percentage)}٪)\` : ''}
                    </span>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-2.5 mt-0.5" />
                  </div>
                )}

                <div className="mt-2 text-center w-full px-0.5">`;

  if (content.includes(barInnerTarget) && !content.includes('کادر شناور راهنما (Tooltip)')) {
    content = content.replace(barInnerTarget, barInnerRepl);
  }

  // Remove the old bottom box that was causing layout jump
  if (oldTooltipRegex.test(content)) {
    content = content.replace(oldTooltipRegex, `</div>\n  );\n};`);
  }

  fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
  console.log('vertical-bar-chart.tsx patched (no jump + floating tooltip)');
}

// Patch point-line-chart.tsx
{
  const file = 'src/components/analytics/point-line-chart.tsx';
  let content = fs.readFileSync(file, 'utf8');

  const oldBoxRegex = /\{\/\* کارت راهنما یا توضیحات تعاملی نقطه فعال در پایین \*\/\}[\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\);\s*\};/;
  if (oldBoxRegex.test(content)) {
    content = content.replace(oldBoxRegex, `</div>\n    </div>\n  );\n};`);
    fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
    console.log('point-line-chart.tsx patched (removed bottom jump box)');
  }
}
