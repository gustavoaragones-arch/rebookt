(function () {
  var IDLE = "IDLE",
    OPEN = "OPEN";
  var state = IDLE;
  var script = document.currentScript;
  if (!script || !script.src) return;
  var slug = script.getAttribute("data-property");
  if (!slug) return;
  var base = script.src.split("/widget.js")[0];
  var z = 9999;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function pulseStyle() {
    var st = document.createElement("style");
    st.textContent =
      "@keyframes rb-pulse{0%,100%{box-shadow:0 0 0 0 rgba(28,58,47,.35)}50%{box-shadow:0 0 0 10px rgba(28,58,47,0)}}";
    document.head.appendChild(st);
  }

  var btn = el("button", "", "Book direct — Save 10%");
  btn.setAttribute("type", "button");
  btn.style.cssText =
    "position:fixed;bottom:24px;right:24px;z-index:" +
    z +
    ";background:#1C3A2F;color:#fff;border:0;border-radius:999px;padding:14px 22px;font:500 15px DM Sans,system-ui,sans-serif;cursor:pointer;animation:rb-pulse 4s ease-in-out infinite";

  var backdrop = el("div");
  backdrop.style.cssText =
    "display:none;position:fixed;inset:0;z-index:" +
    (z + 1) +
    ";background:rgba(0,0,0,.5);backdrop-filter:blur(4px);align-items:center;justify-content:center";

  var modal = el("div");
  modal.style.cssText =
    "position:relative;width:min(480px,92vw);max-height:90vh;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.12);transform:scale(.96);opacity:0;transition:opacity .2s ease-out,transform .2s ease-out";

  var close = el("button", "", "×");
  close.setAttribute("aria-label", "Close");
  close.style.cssText =
    "position:absolute;top:8px;right:10px;z-index:2;border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:#A8A79F";

  var frame = el("iframe");
  frame.setAttribute("title", "Book direct");
  frame.style.cssText = "width:100%;height:min(720px,80vh);border:0;display:block";
  frame.src = base + "/p/" + encodeURIComponent(slug);

  modal.appendChild(close);
  modal.appendChild(frame);
  backdrop.appendChild(modal);
  document.body.appendChild(btn);
  document.body.appendChild(backdrop);
  pulseStyle();

  function open() {
    if (state === OPEN) return;
    state = OPEN;
    backdrop.style.display = "flex";
    requestAnimationFrame(function () {
      modal.style.opacity = "1";
      modal.style.transform = "scale(1)";
    });
  }

  function closeFn() {
    if (state !== OPEN) return;
    state = IDLE;
    modal.style.opacity = "0";
    modal.style.transform = "scale(.96)";
    setTimeout(function () {
      backdrop.style.display = "none";
    }, 200);
  }

  btn.addEventListener("click", open);
  close.addEventListener("click", closeFn);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeFn();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeFn();
  });
})();
