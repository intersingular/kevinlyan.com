(function () {
  const rail = document.getElementById("pc-scroll-rail");
  const paint = document.getElementById("pc-scroll-paint");
  const logo = document.getElementById("pc-scroll-logo");
  const handle = document.getElementById("pc-scroll-handle");
  const heroSkyline = document.getElementById("pc-scroll-hero-skyline");
  const heroTop = document.getElementById("pc-scroll-hero-top");
  const heroIcon = document.getElementById("pc-scroll-hero-icon");
  const runId = "post-fix-3";

  if (!rail || !paint || !logo || !handle || !heroSkyline || !heroTop || !heroIcon) {
    // #region agent log
    fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H4',location:'js/landing-scroll.js:12',message:'Required rail elements missing',data:{rail:!!rail,paint:!!paint,logo:!!logo,handle:!!handle,heroSkyline:!!heroSkyline,heroTop:!!heroTop,heroIcon:!!heroIcon},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return;
  }

  const states = [
    {
      id: "pc-hero",
      type: "hero",
      handleSrc: "assets/figma/hero-paint-handle.svg",
      color: "#f9de8e",
      logoSrc: "",
    },
    {
      id: "pc-row-1",
      type: "row",
      handleSrc: "assets/figma/row-handle-blue.svg",
      color: "#2e7bef",
      logoSrc: "assets/figma/logo-atlassian.svg",
      logoWidth: 101,
      logoHeight: 98,
    },
    {
      id: "pc-row-2",
      type: "row",
      handleSrc: "assets/figma/row-handle-purple.svg",
      color: "#8380ed",
      logoSrc: "assets/figma/logo-loom.svg",
      logoWidth: 141,
      logoHeight: 39.34,
    },
    {
      id: "pc-row-3",
      type: "row",
      handleSrc: "assets/figma/row-handle-teal.svg",
      color: "#2f8ac5",
      logoSrc: "assets/figma/logo-alaska.svg",
      logoWidth: 131,
      logoHeight: 56.9,
    },
  ];

  const sectionEls = states
    .map((s) => ({ ...s, el: document.getElementById(s.id) }))
    .filter((s) => s.el);
  const rowSections = sectionEls.filter((s) => s.type === "row");
  const maxDebugUpdates = 10;
  let debugUpdateCount = 0;

  let rafPending = false;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getActiveState() {
    const sorted = sectionEls.slice().sort((a, b) => a.el.offsetTop - b.el.offsetTop);
    const scrollY = window.scrollY || window.pageYOffset || 0;
    let active = sorted[0];
    for (const s of sorted) {
      if (scrollY >= s.el.offsetTop - 1) {
        active = s;
      } else {
        break;
      }
    }
    const rect = active.el.getBoundingClientRect();
    const progress = clamp((window.innerHeight - rect.top) / rect.height, 0, 1);
    return { state: active, progress };
  }

  function updateRail() {
    rafPending = false;
    const { state, progress } = getActiveState();

    if (handle.getAttribute("src") !== state.handleSrc) {
      handle.src = state.handleSrc;
    }

    if (state.type === "hero") {
      rail.classList.add("is-hero");
      paint.style.height = "0px";
      paint.style.backgroundColor = state.color;
      paint.style.backgroundImage = "none";
      logo.style.opacity = "0";
      logo.removeAttribute("src");
      if (debugUpdateCount < maxDebugUpdates) {
        // #region agent log
        fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H2',location:'js/landing-scroll.js:92',message:'updateRail hero state',data:{activeId:state.id,progress,paintHeight:paint.style.height,logoOpacity:logo.style.opacity,railClass:rail.className},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        // #region agent log
        const heroHandleRect = handle.getBoundingClientRect();
        const heroHandleStyle = window.getComputedStyle(handle);
        fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H6',location:'js/landing-scroll.js:101',message:'hero handle visibility snapshot',data:{src:handle.getAttribute('src'),top:heroHandleRect.top,left:heroHandleRect.left,width:heroHandleRect.width,height:heroHandleRect.height,opacity:heroHandleStyle.opacity,display:heroHandleStyle.display,visibility:heroHandleStyle.visibility},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        debugUpdateCount += 1;
      }
      return;
    }

    rail.classList.remove("is-hero");
    if (logo.getAttribute("src") !== state.logoSrc) {
      logo.src = state.logoSrc;
    }
    if (state.logoWidth) {
      logo.style.width = `${state.logoWidth}px`;
    }
    if (state.logoHeight) {
      logo.style.height = `${state.logoHeight}px`;
    }
    logo.style.opacity = "1";

    // Keep paint attached to the handle at all times.
    const railRect = rail.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const paintAnchor = Math.max(0, Math.round(handleRect.top - railRect.top + 4));
    paint.style.height = `${paintAnchor}px`;

    // Build a hard-stop gradient by visible section boundaries.
    const segments = [];
    for (const s of rowSections) {
      const rect = s.el.getBoundingClientRect();
      const start = clamp(Math.round(rect.top - railRect.top), 0, paintAnchor);
      const end = clamp(Math.round(rect.bottom - railRect.top), 0, paintAnchor);
      if (end > start) {
        segments.push({ start, end, color: s.color, id: s.id });
      }
    }
    segments.sort((a, b) => a.start - b.start);

    if (!segments.length) {
      paint.style.backgroundImage = "none";
      paint.style.backgroundColor = state.color;
    } else {
      const stops = [];
      let cursor = 0;
      for (const seg of segments) {
        if (seg.start > cursor) {
          stops.push(`transparent ${cursor}px ${seg.start}px`);
        }
        stops.push(`${seg.color} ${seg.start}px ${seg.end}px`);
        cursor = seg.end;
      }
      if (cursor < paintAnchor) {
        stops.push(`transparent ${cursor}px ${paintAnchor}px`);
      }
      paint.style.backgroundColor = "transparent";
      paint.style.backgroundImage = `linear-gradient(to bottom, ${stops.join(", ")})`;
    }
    if (debugUpdateCount < maxDebugUpdates) {
      // #region agent log
      fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H2',location:'js/landing-scroll.js:130',message:'updateRail row state',data:{activeId:state.id,scrollY:window.scrollY,progress,paintAnchor,paintHeight:paint.style.height,logoOpacity:logo.style.opacity,logoSrc:logo.getAttribute('src'),handleSrc:handle.getAttribute('src'),segments},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      // #region agent log
      const logoRect = logo.getBoundingClientRect();
      const logoStyle = window.getComputedStyle(logo);
      fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H7',location:'js/landing-scroll.js:154',message:'row logo visibility snapshot',data:{src:logo.getAttribute('src'),opacity:logoStyle.opacity,display:logoStyle.display,visibility:logoStyle.visibility,left:logoRect.left,top:logoRect.top,width:logoRect.width,height:logoRect.height},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      debugUpdateCount += 1;
    }
  }

  function requestUpdate() {
    if (rafPending) return;
    rafPending = true;
    window.requestAnimationFrame(updateRail);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  // #region agent log
  fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H5',location:'js/landing-scroll.js:121',message:'initial rail viewport and display',data:{innerWidth:window.innerWidth,innerHeight:window.innerHeight,railDisplay:window.getComputedStyle(rail).display,paintDisplay:window.getComputedStyle(paint).display,logoDisplay:window.getComputedStyle(logo).display},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  window.requestAnimationFrame(() => {
    const row1 = document.getElementById("pc-row-1");
    const row2 = document.getElementById("pc-row-2");
    const row3 = document.getElementById("pc-row-3");
    const title1 = row1 ? row1.querySelector("h2") : null;
    const title2 = row2 ? row2.querySelector("h2") : null;
    const title3 = row3 ? row3.querySelector("h2") : null;
    const art1 = row1 ? row1.querySelector(".pc-workflow-art") : null;
    const art2 = row2 ? row2.querySelector(".pc-workflow-art") : null;
    const art3 = row3 ? row3.querySelector(".pc-disruptions-art") : null;
    const avatar1 = row1 ? row1.querySelector(".pc-avatar") : null;
    // #region agent log
    fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H3',location:'js/landing-scroll.js:137',message:'section/title/art geometry snapshot',data:{row1:row1?row1.getBoundingClientRect():null,row2:row2?row2.getBoundingClientRect():null,row3:row3?row3.getBoundingClientRect():null,row1Overflow:row1?window.getComputedStyle(row1).overflow:null,title1:title1?title1.getBoundingClientRect():null,title2:title2?title2.getBoundingClientRect():null,title3:title3?title3.getBoundingClientRect():null,art1:art1?art1.getBoundingClientRect():null,art2:art2?art2.getBoundingClientRect():null,art3:art3?art3.getBoundingClientRect():null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H9',location:'js/landing-scroll.js:139',message:'avatar sizing snapshot',data:{clientWidth:avatar1?avatar1.clientWidth:null,clientHeight:avatar1?avatar1.clientHeight:null,naturalWidth:avatar1?avatar1.naturalWidth:null,naturalHeight:avatar1?avatar1.naturalHeight:null,objectFit:avatar1?window.getComputedStyle(avatar1).objectFit:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  });

  function wireAssetLogging(el, label) {
    el.addEventListener("load", function () {
      // #region agent log
      fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H1',location:'js/landing-scroll.js:146',message:'asset loaded',data:{label,src:el.currentSrc||el.getAttribute('src'),naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    });
    el.addEventListener("error", function () {
      // #region agent log
      fetch('http://127.0.0.1:7391/ingest/efa0ec92-c808-41d0-b4b2-afcc7446d868',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2ad3d0'},body:JSON.stringify({sessionId:'2ad3d0',runId,hypothesisId:'H1',location:'js/landing-scroll.js:152',message:'asset failed to load',data:{label,src:el.getAttribute('src')},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    });
  }

  wireAssetLogging(handle, "handle");
  wireAssetLogging(heroSkyline, "heroSkyline");
  wireAssetLogging(heroTop, "heroTop");
  wireAssetLogging(heroIcon, "heroIcon");
  wireAssetLogging(logo, "logo");

  requestUpdate();
})();
