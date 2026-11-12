export const CSS = `
  .dd-launcher{position:relative;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .15s ease,color .15s ease}
  .dd-launcher:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
  .dd-launcher[data-active="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
  .dd-launcher[data-count="true"]{width:auto;padding:0 4px;gap:3px}
  .dd-launcher-count{font-size:10px;font-weight:500;line-height:1;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
  .dd-launcher:hover .dd-launcher-count{color:var(--dsw-alias-label-primary)}
  .dd-panel{position:fixed;right:18px;top:64px;display:flex;align-items:center;z-index:9000;font-family:inherit;color:#e4e4e7;pointer-events:none}
  .dd-frame{position:relative;flex:none;display:flex;flex-direction:column;height:min(70vh,840px);max-height:calc(100vh - 72px);background:#18181b;border:1px solid #27272a;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.14);overflow:visible;color:#f4f4f5;pointer-events:auto;transition:width .2s ease;animation:dd-in .18s ease-out}
  .dd-head{height:36px;flex:none;display:flex;align-items:center;gap:4px;padding:0 8px;background:#27272a;border-bottom:1px solid rgba(63,63,70,.6);border-radius:10px 10px 0 0;user-select:none;cursor:grab}
  .dd-head:active{cursor:grabbing}
  .dd-head-left{display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;flex:1}
  .dd-device{display:flex;align-items:center;gap:4px;min-width:0;height:22px;padding:0 4px;margin-left:-4px;border:0;border-radius:5px;background:transparent;color:#f4f4f5;cursor:pointer;font:inherit}
  .dd-device:hover{background:rgba(255,255,255,.07)}
  .dd-device svg:first-child{color:#10b981;flex:none}
  .dd-device svg:last-child{color:#71717a;flex:none;transition:transform .15s ease}
  .dd-device[data-open="true"] svg:last-child{transform:rotate(180deg)}
  .dd-device-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:500}
  .dd-status{display:inline-flex;align-items:center;gap:3px;height:18px;padding:0 5px;border-radius:4px;font-size:10px;font-weight:500;white-space:nowrap;border:1px solid transparent;flex:none}
  .dd-status[data-compact="true"]{padding:0 4px}
  .dd-status[data-status="live"]{background:rgba(16,185,129,.12);color:#34d399;border-color:rgba(16,185,129,.2)}
  .dd-status[data-status="connecting"]{background:rgba(234,179,8,.12);color:#facc15;border-color:rgba(234,179,8,.2)}
  .dd-status[data-status="error"],.dd-status[data-status="offline"]{background:rgba(239,68,68,.12);color:#f87171;border-color:rgba(239,68,68,.2)}
  .dd-dot{width:4px;height:4px;border-radius:50%;background:currentColor}
  .dd-head-right{display:flex;align-items:center;gap:2px;flex:none}
  .dd-head-refresh{display:flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s ease,color .15s ease}
  .dd-head-refresh:hover{background:rgba(255,255,255,.1);color:#f4f4f5}
  .dd-body{position:relative;flex:1;min-height:0;display:flex}
  .dd-rail{position:absolute;right:calc(100% + 2px);top:50%;transform:translateY(-50%);width:32px;display:flex;flex-direction:column;background:#fff;border:1px solid #e3e3e8;border-right:0;border-radius:9px 0 0 9px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06);pointer-events:auto;z-index:2}
  .dd-rail button{display:flex;align-items:center;justify-content:center;width:100%;height:38px;border:0;border-bottom:1px solid #f1f1f4;background:transparent;color:#63636b;cursor:pointer;transition:background .15s ease,color .15s ease}
  .dd-rail button:last-child{border-bottom:0}
  .dd-rail-sep{height:1px;flex:none;background:#f1f1f4}
  .dd-rail-tip{position:fixed;z-index:9600;transform:translateY(-50%);padding:3px 7px;border-radius:5px;background:rgba(24,24,27,.95);border:1px solid rgba(255,255,255,.14);color:#f4f4f5;font-size:10.5px;line-height:1.4;white-space:nowrap;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.2)}
  .dd-rail button:hover:not([data-disabled="true"]){background:#fafafc;color:#1c1c21}
  .dd-rail button[data-locked="true"]{pointer-events:none}
  .dd-rail button[data-disabled="true"]{opacity:.35;cursor:default}
  .dd-rail button[data-active="true"]{background:#eeedfd;color:#4f46e5}
  .dd-viewport{position:relative;flex:1;min-width:0;background:#000;overflow:hidden;touch-action:none;cursor:crosshair;border-radius:0 0 10px 10px}
  .dd-canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
  .dd-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,.82);color:#e4e4e7;text-align:center;padding:18px;font-size:12px;line-height:1.6;z-index:3}
  .dd-overlay strong{font-size:12.5px;font-weight:600;color:#fafafa}
  .dd-overlay p{margin:0;color:#a1a1aa;max-width:250px}
  .dd-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;padding:0 12px;border:0;border-radius:6px;background:#3f3f46;color:#fafafa;font:inherit;font-size:11.5px;font-weight:500;cursor:pointer;transition:background .15s ease}
  .dd-btn:hover{background:#52525b}
  .dd-spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.2);border-top-color:#a5b4fc;border-radius:50%;animation:dd-spin .9s linear infinite}
  @keyframes dd-spin{to{transform:rotate(360deg)}}
  .dd-ripple{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.35);pointer-events:none;animation:dd-ripple .28s ease-out forwards}
  @keyframes dd-ripple{from{transform:scale(.5);opacity:1}to{transform:scale(1.6);opacity:0}}
  @keyframes dd-in{from{opacity:0}to{opacity:1}}
  .dd-strip{height:50px;flex:none;display:flex;align-items:center;gap:5px;padding:0 8px;background:#1c1c21;border-top:1px solid rgba(63,63,70,.6);border-radius:0 0 10px 10px;overflow-x:auto;overflow-y:hidden}
  .dd-strip-label{flex:none;font-size:10px;color:#71717a;padding-right:2px}
  .dd-thumb{flex:none;height:38px;padding:0;border:1px solid rgba(255,255,255,.14);border-radius:4px;background:#000;overflow:hidden;cursor:pointer;opacity:.75;transition:opacity .15s ease,border-color .15s ease}
  .dd-thumb:hover{opacity:1}
  .dd-thumb[data-selected="true"]{border-color:#818cf8;box-shadow:0 0 0 1px rgba(129,140,248,.7);opacity:1}
  .dd-thumb img{height:100%;width:auto;display:block;object-fit:cover}
  .dd-preview{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;background:#000;cursor:default;animation:dd-in .15s ease-out}
  .dd-preview img{width:100%;height:100%;object-fit:contain;display:block}
  .dd-preview-actions{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:6px}
  .dd-preview-actions button{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:0;border-radius:6px;background:rgba(24,24,27,.72);color:#f4f4f5;cursor:pointer;backdrop-filter:blur(4px);transition:background .15s ease}
  .dd-preview-copy:hover{background:rgba(99,102,241,.85)}
  .dd-preview-close:hover{background:rgba(239,68,68,.85)}
  .dd-pop{position:absolute;right:42px;top:50%;transform:translateY(-50%);width:240px;max-width:calc(100% - 52px);display:flex;flex-direction:column;background:#fff;border:1px solid #e3e3e8;border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,.22),0 2px 6px rgba(0,0,0,.06);z-index:6;overflow:hidden;color:#1c1c21;pointer-events:auto}
  .dd-pop-head{display:flex;align-items:center;justify-content:space-between;gap:8px;height:38px;padding:0 6px 0 12px;font-size:12px;font-weight:600;flex:none}
  .dd-pop-head button{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:#8f8f98;cursor:pointer;transition:background .15s ease,color .15s ease}
  .dd-pop-head button:hover{background:rgba(0,0,0,.06);color:#1c1c21}
  .dd-pop-head button:focus-visible{outline:2px solid #4f46e5;outline-offset:1px}
  .dd-pop textarea{box-sizing:border-box;width:calc(100% - 20px);margin:0 10px;height:96px;resize:none;border:1px solid #ececf0;border-radius:8px;outline:none;background:#f7f7f9;color:#1c1c21;padding:8px 10px;font:inherit;font-size:12px;line-height:1.6;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease}
  .dd-pop textarea::placeholder{color:#96969f}
  .dd-pop textarea:hover{background:#f4f4f7}
  .dd-pop textarea:focus{background:#fff;border-color:#c9c9d2;box-shadow:0 0 0 3px rgba(79,70,229,.1)}
  .dd-pop textarea.dd-pop-url{height:76px;overflow-y:auto;word-break:break-all;overflow-wrap:anywhere}
  .dd-pop input{box-sizing:border-box;width:calc(100% - 20px);margin:0 10px;height:34px;border:1px solid #ececf0;border-radius:8px;outline:none;background:#f7f7f9;color:#1c1c21;padding:0 10px;font:inherit;font-size:12px}
  .dd-pop input:focus{background:#fff;border-color:#c9c9d2;box-shadow:0 0 0 3px rgba(79,70,229,.1)}
  .dd-pop-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px 10px;flex:none}
  .dd-pop-hint{font-size:10px;color:#8f8f98;line-height:1.45;min-width:0}
  .dd-send{border:0;border-radius:7px;height:26px;padding:0 12px;background:#1c1c21;color:#fff;font:inherit;font-size:11px;font-weight:500;cursor:pointer;flex:none;transition:background .15s ease}
  .dd-send:hover:not(:disabled){background:#33333c}
  .dd-send:disabled{background:#e9e9ee;color:#a4a4ad;cursor:default}
  .dd-pop-link{top:50%;max-height:calc(100% - 12px)}
  .dd-link-history{flex:0 1 auto;min-height:0;max-height:160px;overflow-y:auto;margin:6px 10px 0;padding:2px 0 0;border-top:1px solid #f0f0f3}
  .dd-link-history-title{padding:4px 2px;font-size:9.5px;letter-spacing:.04em;text-transform:uppercase;color:#a0a0a8}
  .dd-link-empty{margin:6px 10px 0;padding:10px 0;border-top:1px solid #f0f0f3;text-align:center;font-size:10px;line-height:1.5;color:#a0a0a8}
  .dd-link-row{display:flex;align-items:center;gap:1px;border-radius:6px}
  .dd-link-row:hover{background:#f4f4f7}
  .dd-link-pick{flex:1;min-width:0;display:flex;align-items:center;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;padding:6px;text-align:left;cursor:pointer}
  .dd-link-url{flex:1;min-width:0;font-size:10.5px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dd-link-row[data-pinned="true"] .dd-link-url{color:#4f46e5}
  .dd-link-pick:hover .dd-link-url{color:#4f46e5}
  .dd-link-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:#a0a0a8;cursor:pointer}
  .dd-link-icon:hover{color:#1c1c21}
  .dd-link-pin[data-pinned="true"]{color:#4f46e5}
  .dd-link-pin[data-pinned="true"] svg{fill:currentColor}
  .dd-link-remove:hover{color:#dc2626}
  .dd-menu{position:absolute;left:8px;top:40px;width:238px;max-height:300px;overflow-y:auto;padding:4px;background:#232327;border:1px solid rgba(255,255,255,.12);border-radius:8px;box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:8}
  .dd-menu-title{padding:5px 7px 4px;font-size:9.5px;letter-spacing:.04em;text-transform:uppercase;color:#71717a}
  .dd-menu-item{display:flex;align-items:center;gap:7px;width:100%;height:30px;padding:0 7px;border:0;border-radius:6px;background:transparent;color:#e4e4e7;cursor:pointer;font:inherit;text-align:left}
  .dd-menu-item:hover{background:rgba(255,255,255,.07)}
  .dd-menu-item[data-active="true"]{background:rgba(99,102,241,.18)}
  .dd-menu-item span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px}
  .dd-menu-item em{flex:none;margin-left:auto;font-style:normal;font-size:9.5px;color:#71717a}
  .dd-notice{position:absolute;left:50%;bottom:68px;transform:translateX(-50%);max-width:300px;padding:6px 11px;border-radius:7px;background:rgba(24,24,27,.94);border:1px solid rgba(255,255,255,.14);color:#e4e4e7;font-size:11px;line-height:1.45;text-align:center;z-index:9;box-shadow:0 8px 20px rgba(0,0,0,.3);pointer-events:auto}
  .dd-picker{position:fixed;z-index:9500;width:min(300px,calc(100vw - 16px));display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.14);overflow:hidden;color:var(--dsw-alias-label-primary);font-family:inherit;pointer-events:auto}
  .dd-picker-scroll{flex:1;min-height:0;overflow-y:auto}
  .dd-picker-section{height:26px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;background:var(--dsw-alias-bg-layer-2);border-top:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1);font-size:10.5px;color:var(--dsw-alias-label-secondary)}
  .dd-picker-section:first-child{border-top:0}
  .dd-picker-row{display:flex;align-items:center;gap:7px;padding:6px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
  .dd-picker-row:last-child{border-bottom:0}
  .dd-picker-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;padding:0;cursor:pointer}
  .dd-picker-line{display:flex;align-items:center;gap:6px;min-width:0}
  .dd-picker-name{font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dd-picker-main:hover .dd-picker-name{color:var(--dsw-alias-brand-primary)}
  .dd-picker-detail{font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dd-picker-status{flex:none;display:inline-flex;align-items:center;gap:3px;height:16px;padding:0 5px;border-radius:4px;font-size:9.5px;font-weight:500}
  .dd-picker-status[data-state="booted"]{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);color:var(--dsw-alias-state-success-primary)}
  .dd-picker-status[data-state="starting"]{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);color:var(--dsw-alias-brand-primary)}
  .dd-picker-icon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
  .dd-picker-icon:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
  .dd-picker-icon[data-danger="true"]:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-state-error-primary)}
  .dd-picker-icon:disabled{opacity:.4;cursor:default}
  .dd-picker-start{flex:none;display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border:0;border-radius:5px;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);font:inherit;font-size:10.5px;font-weight:500;cursor:pointer}
  .dd-picker-start:hover:not(:disabled){opacity:.9}
  .dd-picker-start:disabled{opacity:.4;cursor:default}
  .dd-picker-more{width:100%;height:24px;padding:0 12px;display:flex;align-items:center;gap:4px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10.5px;cursor:pointer}
  .dd-picker-more:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary)}
  .dd-picker-empty{padding:16px 12px;text-align:center;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
  .dd-picker-notice{padding:0 12px 7px;font-size:10.5px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
  .dd-picker-wifi{border-top:1px solid var(--dsw-alias-border-l1);padding:8px 12px;display:flex;flex-direction:column;gap:5px;background:var(--dsw-alias-bg-base)}
  .dd-picker-wifi-row{display:flex;align-items:center;gap:6px}
  .dd-picker-input{flex:1;min-width:0;height:24px;padding:0 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;outline:none}
  .dd-picker-input:focus{border-color:var(--dsw-alias-brand-primary)}
  .dd-picker-result{display:flex;align-items:center;gap:4px;font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow:hidden}
  .dd-picker-result[data-ok="false"]{color:var(--dsw-alias-state-error-primary)}
  .dd-picker-result[data-ok="true"]{color:var(--dsw-alias-state-success-primary)}
  .dd-picker-spinner{width:10px;height:10px;border:1.5px solid color-mix(in srgb, currentColor 25%, transparent);border-top-color:currentColor;border-radius:50%;animation:dd-spin .8s linear infinite;display:inline-block;flex:none}
  .dd-shot-mask{position:fixed;inset:0;z-index:9450;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.5);backdrop-filter:blur(2px)}
  .dd-shot-panel{width:min(560px,calc(100vw - 32px));max-height:min(72vh,640px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden;color:var(--dsw-alias-label-primary);font-family:inherit;animation:dd-in .16s ease-out}
  .dd-shot-head{flex:none;display:flex;align-items:flex-start;gap:10px;padding:12px 12px 10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
  .dd-shot-titles{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
  .dd-shot-titles strong{font-size:12.5px;font-weight:600}
  .dd-shot-titles span{font-size:10.5px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
  .dd-shot-close{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
  .dd-shot-close:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
  .dd-shot-clear{flex:none;height:24px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;line-height:1;cursor:pointer}
  .dd-shot-clear:hover:not(:disabled){border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
  .dd-shot-clear[data-confirm="true"]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
  .dd-shot-clear:disabled{opacity:.45;cursor:default}
  .dd-shot-grid{flex:1;min-height:0;overflow-y:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;align-content:start}
  .dd-shot-item{position:relative;display:flex;flex-direction:column;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:#000;overflow:hidden;color:var(--dsw-alias-label-primary);font:inherit;text-align:center;transition:border-color .15s ease}
  .dd-shot-item:hover{border-color:var(--dsw-alias-brand-primary)}
  .dd-shot-item[data-busy="true"]{border-color:var(--dsw-alias-brand-primary)}
  .dd-shot-pick{display:flex;flex-direction:column;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:center;cursor:pointer}
  .dd-shot-pick:disabled{cursor:default}
  .dd-shot-remove{position:absolute;top:3px;right:3px;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;background:rgba(9,9,11,.62);color:#fafafa;cursor:pointer;opacity:0;transition:opacity .12s ease,background .12s ease}
  .dd-shot-item:hover .dd-shot-remove,.dd-shot-remove:focus-visible{opacity:1}
  .dd-shot-remove:hover{background:#dc2626}
  .dd-shot-remove:disabled{display:none}
  .dd-shot-item img{display:block;width:100%;aspect-ratio:9/16;object-fit:contain;background:#000;opacity:.92}
  .dd-shot-pick:hover img{opacity:1}
  .dd-shot-time{display:block;padding:4px 2px;font-size:9.5px;line-height:1.3;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--dsw-alias-bg-base)}
  .dd-shot-item[data-busy="true"] .dd-shot-time{color:var(--dsw-alias-brand-primary)}
  .dd-shot-state{flex:1;min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px 18px;text-align:center;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
  .dd-shot-state .dd-spinner{border-color:color-mix(in srgb, var(--dsw-alias-label-secondary) 25%, transparent);border-top-color:var(--dsw-alias-brand-primary)}
  .dd-shot-error{flex:none;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:10.5px;line-height:1.45;color:var(--dsw-alias-state-error-primary)}
`;
