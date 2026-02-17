/**
 * Icon Grid Unlimited - Frontend View Script
 * Extracted for caching and optimized for modern browsers
 */

import anime from "animejs";

(function () {
  "use strict";

  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", initIconGrids);

  function initIconGrids() {
    // Find all icon grid blocks on the page
    const grids = document.querySelectorAll(
      ".wp-block-icon-grid-unlimited-icon-grid",
    );
    grids.forEach(initGrid);
  }

  function initGrid(container) {
    const blockId = container.id;
    const gridContainer = container.querySelector(".icon-grid-container");
    if (!gridContainer?.dataset.config) return;

    const config = JSON.parse(gridContainer.dataset.config);

    // Grid dimensions
    const gridRows = parseInt(container.dataset.gridRows) || 6;
    const gridCols = parseInt(container.dataset.gridCols) || 6;
    const totalTiles = gridRows * gridCols;

    // Enlarge grid configuration
    const enlargeEnabled = container.dataset.enlargeEnabled === "true";
    const subgridRows = parseInt(container.dataset.subgridRows) || gridRows;
    const subgridCols = parseInt(container.dataset.subgridCols) || gridCols;
    const subgridStartRow = parseInt(container.dataset.subgridStartRow) || 0;
    const subgridStartCol = parseInt(container.dataset.subgridStartCol) || 0;
    const triggerButton = container.dataset.triggerButton || "";
    const triggerEvent = container.dataset.triggerEvent || "";
    const triggerScroll = parseInt(container.dataset.triggerScroll) || 0;

    // Mobile mode configuration
    const mobileEnabled = container.dataset.mobileEnabled === "true";
    const mobileBreakpoint =
      parseInt(container.dataset.mobileBreakpoint) || 768;
    const mobileCols = parseInt(container.dataset.mobileCols) || 3;
    const mobileHighlightDuration =
      parseInt(container.dataset.mobileHighlightDuration) || 2000;
    const mobileHighlightInterval =
      parseInt(container.dataset.mobileHighlightInterval) || 800;

    // Animation configuration
    const CONFIG = config.config;
    const ANIMATION_ROUNDS = config.animationRounds || [];
    const orthoLinesEnabled = config.orthoLinesEnabled !== false;

    // Pre-compute shadow strings (optimization: avoid repeated string concatenation)
    const SHADOW = {
      active: `${CONFIG.activeShadowX ?? 0}px ${CONFIG.activeShadowY ?? 8}px ${
        CONFIG.activeShadowBlur ?? 10
      }px ${CONFIG.activeShadowSpread ?? 0}px ${
        CONFIG.activeShadowColor || "rgba(0,0,0,0.10)"
      }`,
      hidden: CONFIG.activeShadowOpacityOnly
        ? `${CONFIG.activeShadowX ?? 0}px ${CONFIG.activeShadowY ?? 8}px ${
            CONFIG.activeShadowBlur ?? 10
          }px ${CONFIG.activeShadowSpread ?? 0}px rgba(0,0,0,0)`
        : "0 0 0 0 rgba(0,0,0,0)",
    };

    // State
    let highlightInterval = null;
    let currentlyHighlighted = new Set();
    let currentRoundIndex = 0;
    let isEnlarged = !enlargeEnabled;
    let isMobileMode = false;
    let mobileHighlightTimer = null;
    let mobileActiveTiles = []; // tracks {cell, expireTime} for the 3 active tiles

    // Get all cell wrappers
    const allCellWrappers = Array.from(
      container.querySelectorAll(".icon-grid-cell-wrapper"),
    );
    const lineOverlay = document.getElementById(blockId + "-overlay");
    const wrapperEl = container.querySelector(".icon-grid-wrapper");

    // OPTIMIZATION 1: Pre-build position-to-cell lookup map (O(1) lookup)
    const positionMap = new Map();
    allCellWrappers.forEach((wrapper) => {
      const pos = parseInt(wrapper.dataset.fullGridPosition);
      const cell = wrapper.querySelector(".icon-grid-cell");
      if (pos && cell) positionMap.set(pos, cell);
    });

    // Reverse lookup: cell -> position (for connection line caching)
    const cellToPosition = new Map();
    positionMap.forEach((cell, pos) => cellToPosition.set(cell, pos));

    // OPTIMIZATION 2: Geometry cache for cells
    const geometryCache = new Map();
    let geometryCacheValid = false;

    // OPTIMIZATION 3: Connection line pool + path length cache
    const linePool = [];
    let linePoolIndex = 0;
    const pathCache = new Map();

    function invalidateGeometryCache() {
      geometryCacheValid = false;
      geometryCache.clear();
      pathCache.clear();
    }

    function rebuildGeometryCache() {
      if (geometryCacheValid) return;
      geometryCache.clear();
      const wrapperRect = wrapperEl.getBoundingClientRect();
      positionMap.forEach((cell) => {
        const rect = cell.getBoundingClientRect();
        const adjustedRect = {
          left: rect.left - wrapperRect.left,
          right: rect.right - wrapperRect.left,
          top: rect.top - wrapperRect.top,
          bottom: rect.bottom - wrapperRect.top,
          width: rect.width,
          height: rect.height,
        };
        geometryCache.set(cell, {
          cx: adjustedRect.left + rect.width / 2,
          cy: adjustedRect.top + rect.height / 2,
          rect: adjustedRect,
        });
      });
      geometryCacheValid = true;
    }

    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(invalidateGeometryCache, 150);
      },
      { passive: true },
    );

    // Line pool management (avoids DOM create/remove per round)
    function getPooledLine() {
      let pathElement;
      if (linePoolIndex < linePool.length) {
        pathElement = linePool[linePoolIndex];
        anime.remove(pathElement);
        pathElement.style.visibility = "";
      } else {
        pathElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        pathElement.setAttribute("class", "icon-grid-connecting-line");
        pathElement.style.stroke = CONFIG.lineColor || "#333";
        pathElement.style.strokeWidth = (CONFIG.lineStrokeWidth || 2) + "px";
        lineOverlay.appendChild(pathElement);
        linePool.push(pathElement);
      }
      linePoolIndex++;
      return pathElement;
    }

    function resetLinePool() {
      for (let i = 0; i < linePoolIndex; i++) {
        linePool[i].style.visibility = "hidden";
        anime.remove(linePool[i]);
      }
      linePoolIndex = 0;
    }

    // Cache DOM element references on each cell
    allCellWrappers.forEach((wrapper) => {
      const cell = wrapper.querySelector(".icon-grid-cell");
      if (cell) {
        cell._cellBg = cell.querySelector(".icon-grid-cell-bg");
        cell._wrapper = cell.querySelector(".icon-grid-wrapper");
        cell._wireframe = cell.querySelector(".icon-grid-wireframe");
        cell._gradient = cell.querySelector(".icon-grid-gradient");
        cell._label = cell.querySelector(".icon-grid-label");
      }
    });

    // Helper functions
    function getCellAtPosition(pos) {
      if (pos < 1 || pos > totalTiles) return null;
      return positionMap.get(pos) || null;
    }

    function isPositionInSubgrid(pos) {
      if (!enlargeEnabled || isEnlarged) return true;
      const posZero = pos - 1;
      const row = Math.floor(posZero / gridCols);
      const col = posZero % gridCols;
      return (
        row >= subgridStartRow &&
        row < subgridStartRow + subgridRows &&
        col >= subgridStartCol &&
        col < subgridStartCol + subgridCols
      );
    }

    function enlargeGrid() {
      if (isEnlarged) return;
      isEnlarged = true;
      container.classList.add("enlarged");

      const expansionTiles = container.querySelectorAll(".expansion-tile");
      expansionTiles.forEach((tile) => {
        tile.style.opacity = "1";
        const cell = tile.querySelector(".icon-grid-cell");
        if (cell) {
          const randomDelay = Math.random() * 1500;
          anime({
            targets: cell,
            opacity: 1,
            duration: 350,
            delay: randomDelay,
            easing: "easeOutQuad",
          });
        }
      });
    }

    // Set up enlarge triggers
    if (enlargeEnabled) {
      if (triggerButton) {
        document
          .querySelectorAll(triggerButton)
          .forEach((btn) => btn.addEventListener("click", enlargeGrid));
      }
      if (triggerEvent) {
        window.addEventListener(triggerEvent, enlargeGrid);
      }
      if (triggerScroll > 0) {
        let scrollTriggered = false;
        window.addEventListener(
          "scroll",
          () => {
            if (!scrollTriggered && window.scrollY >= triggerScroll) {
              scrollTriggered = true;
              enlargeGrid();
            }
          },
          { passive: true },
        );
      }
    }

    function getCellGeometry(cell) {
      rebuildGeometryCache();
      return geometryCache.get(cell) || null;
    }

    function getOrthoExitPoint(geom, dx, dy, spreadInfo = null) {
      const { cx, cy, rect } = geom;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDy < CONFIG.straightThreshold) {
        return { x: dx > 0 ? rect.right : rect.left, y: cy };
      }
      if (absDx < CONFIG.straightThreshold) {
        return { x: cx, y: dy > 0 ? rect.bottom : rect.top };
      }

      let spreadOffset = 0;
      if (spreadInfo?.total > 1) {
        const spreadWidth = Math.min(
          rect.width * 0.6,
          spreadInfo.total * CONFIG.turnOffset * 2,
        );
        const step = spreadWidth / (spreadInfo.total - 1);
        spreadOffset = -spreadWidth / 2 + step * spreadInfo.index;
      }

      return { x: cx + spreadOffset, y: dy > 0 ? rect.bottom : rect.top };
    }

    function getOrthoEntryPoint(geom, dx, dy) {
      const { cx, cy, rect } = geom;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDy < CONFIG.straightThreshold) {
        return { x: dx > 0 ? rect.left : rect.right, y: cy };
      }
      if (absDx < CONFIG.straightThreshold) {
        return { x: cx, y: dy > 0 ? rect.top : rect.bottom };
      }
      return { x: dx > 0 ? rect.left : rect.right, y: cy };
    }

    function getDiagonalExitPoint(geom, dx, dy) {
      const { cx, cy, rect } = geom;
      const hw = rect.width / 2;
      const hh = rect.height / 2;
      const ratio = Math.min(hw / Math.abs(dx || 1), hh / Math.abs(dy || 1));
      return { x: cx + dx * ratio * 0.8, y: cy + dy * ratio * 0.8 };
    }

    function getDiagonalEntryPoint(geom, dx, dy) {
      const { cx, cy, rect } = geom;
      const hw = rect.width / 2;
      const hh = rect.height / 2;
      const ratio = Math.min(hw / Math.abs(dx || 1), hh / Math.abs(dy || 1));
      return { x: cx - dx * ratio * 0.8, y: cy - dy * ratio * 0.8 };
    }

    function buildPathString(start, end, dx, dy, targetCy, useOrtho) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (
        !useOrtho ||
        absDx < CONFIG.straightThreshold ||
        absDy < CONFIG.straightThreshold
      ) {
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      }

      const r = Math.min(CONFIG.cornerRadius, absDx / 2, absDy / 2);
      const xDir = dx > 0 ? 1 : -1;
      const yDir = dy > 0 ? 1 : -1;

      return `M ${start.x} ${start.y} L ${start.x} ${targetCy - yDir * r} Q ${
        start.x
      } ${targetCy} ${start.x + xDir * r} ${targetCy} L ${end.x} ${end.y}`;
    }

    function createConnectionLine(
      fromCell,
      toCell,
      spreadInfo = null,
      useOrtho = orthoLinesEnabled,
    ) {
      const fromGeom = getCellGeometry(fromCell);
      const toGeom = getCellGeometry(toCell);
      const dx = toGeom.cx - fromGeom.cx;
      const dy = toGeom.cy - fromGeom.cy;

      const start = useOrtho
        ? getOrthoExitPoint(fromGeom, dx, dy, spreadInfo)
        : getDiagonalExitPoint(fromGeom, dx, dy);
      const end = useOrtho
        ? getOrthoEntryPoint(toGeom, dx, dy)
        : getDiagonalEntryPoint(toGeom, dx, dy);
      const d = buildPathString(start, end, dx, dy, toGeom.cy, useOrtho);

      const pathElement = getPooledLine();
      pathElement.setAttribute("d", d);

      // Check path length cache (avoids expensive getTotalLength reflow)
      const fromPos = cellToPosition.get(fromCell);
      const toPos = cellToPosition.get(toCell);
      const cacheKey = `${fromPos}-${toPos}-${spreadInfo?.index ?? 0}-${
        spreadInfo?.total ?? 0
      }-${useOrtho ? 1 : 0}`;

      let pathLength;
      const cached = pathCache.get(cacheKey);
      if (cached && cached.d === d) {
        pathLength = cached.pathLength;
      } else {
        pathLength = pathElement.getTotalLength();
        pathCache.set(cacheKey, { d, pathLength });
      }

      pathElement.style.strokeDasharray = pathLength;
      pathElement.style.strokeDashoffset = pathLength;

      return { pathElement, pathLength };
    }

    // Detect Safari for strokeDashoffset direction
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    function animateLineIn(connection) {
      anime({
        targets: connection.pathElement,
        strokeDashoffset: 0,
        duration: CONFIG.lineDrawDuration * 1000,
        easing: "easeInOutQuad",
      });
    }

    function animateLineOut(connection) {
      const targetOffset = isSafari
        ? connection.pathLength
        : -connection.pathLength;
      anime({
        targets: connection.pathElement,
        strokeDashoffset: targetOffset,
        duration: CONFIG.lineDrawDuration * 1000,
        easing: "easeInOutQuad",
        complete: () => {
          connection.pathElement.style.visibility = "hidden";
        },
      });
    }

    function highlightCell(cell) {
      if (cell.matches(":hover")) return;

      const {
        _cellBg: cellBg,
        _wrapper: wrapper,
        _wireframe: wireframe,
        _gradient: gradient,
        _label: label,
      } = cell;

      if (label) label.style.visibility = "visible";

      // O(1) cancel - avoids expensive anime.remove() global search
      if (cell._anim) cell._anim.pause();

      const cellDuration = CONFIG.cellAnimDuration * 1000;
      const tl = anime.timeline({ easing: "easeOutQuad" });

      tl.add(
        {
          targets: cellBg,
          scale: CONFIG.hoverScale || 1.08,
          backgroundColor: CONFIG.hoverBgColor || "#fff",
          duration: cellDuration,
          easing: "easeOutBack",
        },
        0,
      );

      if (wrapper) {
        tl.add(
          {
            targets: wrapper,
            translateY: (CONFIG.hoverSlideAmount || -10) + "%",
            duration: cellDuration,
            easing: "easeOutBack",
          },
          0,
        );
      }

      if (wireframe) {
        tl.add({ targets: wireframe, opacity: 0, duration: cellDuration }, 0);
      }

      if (gradient) {
        tl.add({ targets: gradient, opacity: 1, duration: cellDuration }, 0);
      }

      cell._anim = tl;
    }

    function unhighlightCell(cell) {
      if (cell.matches(":hover")) return;

      const {
        _cellBg: cellBg,
        _wrapper: wrapper,
        _wireframe: wireframe,
        _gradient: gradient,
        _label: label,
      } = cell;

      if (label) label.style.visibility = "";

      // O(1) cancel
      if (cell._anim) cell._anim.pause();

      const cellDuration = CONFIG.cellAnimDuration * 1000;
      const tl = anime.timeline({ easing: "easeOutQuad" });

      tl.add(
        {
          targets: cellBg,
          scale: 1,
          backgroundColor: CONFIG.inactiveBgColor || "rgba(255,255,255,0)",
          duration: cellDuration,
          easing: "easeInOutQuad",
        },
        0,
      );

      if (wrapper) {
        tl.add(
          {
            targets: wrapper,
            translateY: "0%",
            duration: cellDuration,
            easing: "easeInOutQuad",
          },
          0,
        );
      }

      if (wireframe) {
        tl.add({ targets: wireframe, opacity: 1, duration: cellDuration }, 0);
      }

      if (gradient) {
        tl.add({ targets: gradient, opacity: 0, duration: cellDuration }, 0);
      }

      cell._anim = tl;
    }

    function playNextRound() {
      if (ANIMATION_ROUNDS.length === 0) return;

      currentlyHighlighted.forEach(unhighlightCell);
      currentlyHighlighted = new Set();

      // Reset line pool (reuses DOM elements instead of create/remove)
      resetLinePool();

      const round = ANIMATION_ROUNDS[currentRoundIndex];
      currentRoundIndex = (currentRoundIndex + 1) % ANIMATION_ROUNDS.length;

      const allSourceCells = new Set();
      const allTargetCells = new Set();
      const allConnections = [];

      round.forEach((group, groupIndex) => {
        const staggerDelay = groupIndex * CONFIG.groupStaggerDelay;

        const useDiagonal = group[group.length - 1] === "d";
        const positions = useDiagonal ? group.slice(0, -1) : group;
        const useOrtho = !useDiagonal && orthoLinesEnabled;

        if (!positions.every((pos) => isPositionInSubgrid(pos))) return;

        const sourceCell = getCellAtPosition(positions[0]);
        const targetCells = positions
          .slice(1)
          .map((pos) => getCellAtPosition(pos));

        if (
          !sourceCell ||
          targetCells.length === 0 ||
          targetCells.some((c) => !c)
        )
          return;

        const connections = targetCells.map((target, i) =>
          createConnectionLine(
            sourceCell,
            target,
            { index: i, total: targetCells.length },
            useOrtho,
          ),
        );

        allSourceCells.add(sourceCell);
        targetCells.forEach((c) => allTargetCells.add(c));
        allConnections.push(...connections);

        setTimeout(() => {
          if (!currentlyHighlighted.has(sourceCell)) {
            highlightCell(sourceCell);
            currentlyHighlighted.add(sourceCell);
          }
          connections.forEach(animateLineIn);

          setTimeout(() => {
            targetCells.forEach((cell) => {
              if (!currentlyHighlighted.has(cell)) {
                highlightCell(cell);
                currentlyHighlighted.add(cell);
              }
            });
          }, CONFIG.lineDrawDuration * 1000);
        }, staggerDelay);
      });

      setTimeout(() => {
        allSourceCells.forEach(unhighlightCell);
        allConnections.forEach(animateLineOut);

        setTimeout(() => {
          allTargetCells.forEach(unhighlightCell);
          currentlyHighlighted = new Set();
          // Pool cleanup handled by resetLinePool() at start of next round
        }, CONFIG.lineDrawDuration * 1000);
      }, CONFIG.highlightDuration);
    }

    // =========================================
    // Mobile Mode
    // =========================================

    function checkMobileMode() {
      if (!mobileEnabled) return false;
      return window.innerWidth < mobileBreakpoint;
    }

    // Collect only visible (non-empty) tiles for mobile compact grid
    function getMobileVisibleWrappers() {
      return allCellWrappers.filter(
        (w) =>
          !w.classList.contains("empty-cell") &&
          !w.classList.contains("expansion-tile"),
      );
    }

    function activateMobileMode() {
      if (isMobileMode) return;
      isMobileMode = true;
      container.classList.add("mobile-mode");

      // Stop desktop animation rounds
      if (highlightInterval) {
        clearInterval(highlightInterval);
        highlightInterval = null;
      }
      currentlyHighlighted.forEach(unhighlightCell);
      currentlyHighlighted = new Set();
      resetLinePool();

      // Hide the line overlay
      if (lineOverlay) lineOverlay.style.display = "none";

      // Reflow: set mobile columns, hide empty wrappers, pack visible ones
      gridContainer.style.gridTemplateColumns = `repeat(${mobileCols}, 1fr)`;

      allCellWrappers.forEach((w) => {
        if (
          w.classList.contains("empty-cell") ||
          w.classList.contains("expansion-tile")
        ) {
          w.style.display = "none";
        } else {
          w.style.display = "";
        }
      });

      // Show all visible cells with entrance
      const visibleCells = getMobileVisibleWrappers()
        .map((w) => w.querySelector(".icon-grid-cell"))
        .filter(Boolean);

      visibleCells.forEach((cell) => {
        anime({
          targets: cell,
          opacity: 1,
          duration: 350,
          delay: Math.random() * 800,
          easing: "easeOutQuad",
        });
      });

      // Start mobile random highlight loop after entrance
      setTimeout(() => startMobileHighlightLoop(visibleCells), 1200);
    }

    function deactivateMobileMode() {
      if (!isMobileMode) return;
      isMobileMode = false;
      container.classList.remove("mobile-mode");

      // Stop mobile highlight loop
      stopMobileHighlightLoop();

      // Restore line overlay
      if (lineOverlay) lineOverlay.style.display = "";

      // Restore grid columns to desktop
      const cols = enlargeEnabled ? subgridCols : gridCols;
      gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      // Show all wrappers again
      allCellWrappers.forEach((w) => {
        w.style.display = "";
      });

      // Unhighlight everything
      currentlyHighlighted.forEach(unhighlightCell);
      currentlyHighlighted = new Set();
      mobileActiveTiles = [];
    }

    function startMobileHighlightLoop(visibleCells) {
      if (!isMobileMode || visibleCells.length === 0) return;

      // Pick a random cell that isn't already active
      function pickRandom() {
        const activeCellSet = new Set(mobileActiveTiles.map((t) => t.cell));
        const candidates = visibleCells.filter((c) => !activeCellSet.has(c));
        if (candidates.length === 0)
          return visibleCells[Math.floor(Math.random() * visibleCells.length)];
        return candidates[Math.floor(Math.random() * candidates.length)];
      }

      // Activate a new tile: highlight it, schedule its deactivation
      function activateNewTile() {
        if (!isMobileMode) return;

        const cell = pickRandom();
        highlightCell(cell);
        currentlyHighlighted.add(cell);

        const entry = {
          cell: cell,
          timer: setTimeout(() => {
            // When this tile's duration expires, unhighlight it and remove from active list
            unhighlightCell(cell);
            currentlyHighlighted.delete(cell);
            mobileActiveTiles = mobileActiveTiles.filter((t) => t !== entry);
          }, mobileHighlightDuration),
        };
        mobileActiveTiles.push(entry);
      }

      // Seed the initial 3 tiles with staggered starts
      for (let i = 0; i < Math.min(3, visibleCells.length); i++) {
        setTimeout(() => activateNewTile(), i * (mobileHighlightInterval / 2));
      }

      // Then keep activating a new tile at the configured interval
      mobileHighlightTimer = setInterval(() => {
        if (!isMobileMode) {
          clearInterval(mobileHighlightTimer);
          return;
        }
        activateNewTile();
      }, mobileHighlightInterval);
    }

    function stopMobileHighlightLoop() {
      if (mobileHighlightTimer) {
        clearInterval(mobileHighlightTimer);
        mobileHighlightTimer = null;
      }
      // Clear all active tile timers
      mobileActiveTiles.forEach((t) => {
        clearTimeout(t.timer);
        unhighlightCell(t.cell);
        currentlyHighlighted.delete(t.cell);
      });
      mobileActiveTiles = [];
    }

    // Handle resize: switch between mobile and desktop mode
    if (mobileEnabled) {
      let mobileResizeTimeout;
      window.addEventListener(
        "resize",
        () => {
          clearTimeout(mobileResizeTimeout);
          mobileResizeTimeout = setTimeout(() => {
            const shouldBeMobile = checkMobileMode();
            if (shouldBeMobile && !isMobileMode) {
              activateMobileMode();
            } else if (!shouldBeMobile && isMobileMode) {
              deactivateMobileMode();
              // Re-trigger desktop entrance
              hasAnimated = false;
              startAnimation();
            }
          }, 200);
        },
        { passive: true },
      );
    }

    function playEntranceAnimation() {
      const cells = Array.from(
        container.querySelectorAll(
          ".icon-grid-cell-wrapper:not(.expansion-tile) .icon-grid-cell",
        ),
      );
      cells.forEach((cell) => {
        const randomDelay = Math.random() * 1500;
        anime({
          targets: cell,
          opacity: 1,
          duration: 350,
          delay: randomDelay,
          easing: "easeOutQuad",
        });
      });

      setTimeout(() => {
        cells.forEach(unhighlightCell);
      }, 1900);

      setTimeout(() => {
        playNextRound();
        const effectiveInterval =
          CONFIG.loopInterval + (CONFIG.transitionOffset || 0);
        highlightInterval = setInterval(
          playNextRound,
          Math.max(100, effectiveInterval),
        );
      }, CONFIG.startupDelay ?? 2000);
    }

    // Hover animations
    container.querySelectorAll(".icon-grid-cell").forEach((cell) => {
      const {
        _cellBg: cellBg,
        _wrapper: wrapper,
        _wireframe: wireframe,
        _gradient: gradient,
        _label: label,
      } = cell;

      cell.addEventListener("mouseenter", () => {
        if (currentlyHighlighted.has(cell)) return;

        if (cell._anim) cell._anim.pause();

        const tl = anime.timeline({ easing: "easeOutQuad" });

        tl.add(
          {
            targets: cellBg,
            scale: CONFIG.hoverScale || 1.08,
            backgroundColor: CONFIG.hoverBgColor || "#fff",
            duration: 300,
            easing: "easeOutBack",
          },
          0,
        );

        if (wrapper)
          tl.add(
            {
              targets: wrapper,
              translateY: (CONFIG.hoverSlideAmount || -10) + "%",
              duration: 300,
              easing: "easeOutBack",
            },
            0,
          );
        if (wireframe)
          tl.add({ targets: wireframe, opacity: 0, duration: 250 }, 0);
        if (gradient)
          tl.add({ targets: gradient, opacity: 1, duration: 250 }, 0);
        if (label) label.style.visibility = "visible";

        cell._anim = tl;
      });

      cell.addEventListener("mouseleave", () => {
        if (currentlyHighlighted.has(cell)) return;

        if (cell._anim) cell._anim.pause();

        const tl = anime.timeline({ easing: "easeOutQuad" });

        tl.add(
          {
            targets: cellBg,
            scale: 1,
            backgroundColor: CONFIG.inactiveBgColor || "rgba(255,255,255,0)",
            duration: 250,
            easing: "easeOutQuad",
          },
          0,
        );

        if (wrapper)
          tl.add({ targets: wrapper, translateY: "0%", duration: 250 }, 0);
        if (wireframe)
          tl.add({ targets: wireframe, opacity: 1, duration: 250 }, 0);
        if (gradient)
          tl.add({ targets: gradient, opacity: 0, duration: 250 }, 0);
        if (label) label.style.visibility = "";

        cell._anim = tl;
      });
    });

    // IntersectionObserver for lazy start and pause when off-screen
    let hasAnimated = false;

    function startAnimation() {
      if (hasAnimated) return;
      hasAnimated = true;

      // If mobile mode is active on first load, go straight to mobile
      if (mobileEnabled && checkMobileMode()) {
        activateMobileMode();
        return;
      }

      playEntranceAnimation();
    }

    function pauseAnimation() {
      if (isMobileMode) {
        stopMobileHighlightLoop();
        return;
      }
      if (highlightInterval) {
        clearInterval(highlightInterval);
        highlightInterval = null;
      }
    }

    function resumeAnimation() {
      if (isMobileMode) {
        const visibleCells = getMobileVisibleWrappers()
          .map((w) => w.querySelector(".icon-grid-cell"))
          .filter(Boolean);
        startMobileHighlightLoop(visibleCells);
        return;
      }
      if (!highlightInterval && hasAnimated) {
        playNextRound();
        const effectiveInterval =
          CONFIG.loopInterval + (CONFIG.transitionOffset || 0);
        highlightInterval = setInterval(
          playNextRound,
          Math.max(100, effectiveInterval),
        );
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hasAnimated ? resumeAnimation() : startAnimation();
          } else {
            pauseAnimation();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(container);

    // Dynamic vertical centering
    if (container.dataset.centerVertically === "true") {
      const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => fn(...args), delay);
        };
      };

      const targetSelector = container.dataset.centerTarget;
      const targetElement = targetSelector
        ? document.querySelector(targetSelector)
        : container;

      if (targetElement) {
        function updateVerticalCenter() {
          const gridHeight = container.offsetHeight;
          const viewportHeight = window.innerHeight;
          const offset = Math.max(0, (viewportHeight - gridHeight) / 2);
          targetElement.style.top = offset + "px";
        }

        const debouncedUpdate = debounce(updateVerticalCenter, 100);
        updateVerticalCenter();
        window.addEventListener("resize", debouncedUpdate);

        const resizeObserver = new ResizeObserver(debouncedUpdate);
        resizeObserver.observe(container);
      }
    }

    // =========================================
    // Expose Global API for external control
    // Used by wp-logo-explode Link Icon Grid feature
    // =========================================

    // Initialize global object if not exists
    if (!window.iconGridUnlimited) {
      window.iconGridUnlimited = {
        grids: [],

        /**
         * Highlight a tile by element reference
         * @param {HTMLElement} tileWrapper - The .icon-grid-cell-wrapper element
         */
        highlightTile: function (tileWrapper) {
          const cell = tileWrapper.querySelector(".icon-grid-cell");
          if (cell && typeof highlightCell === "function") {
            // Find which grid this tile belongs to
            const gridData = this.grids.find((g) => g.container.contains(cell));
            if (gridData) {
              gridData.highlightCell(cell);
            }
          }
        },

        /**
         * Unhighlight a tile by element reference
         * @param {HTMLElement} tileWrapper - The .icon-grid-cell-wrapper element
         */
        unhighlightTile: function (tileWrapper) {
          const cell = tileWrapper.querySelector(".icon-grid-cell");
          if (cell && typeof unhighlightCell === "function") {
            // Find which grid this tile belongs to
            const gridData = this.grids.find((g) => g.container.contains(cell));
            if (gridData) {
              gridData.unhighlightCell(cell);
            }
          }
        },

        /**
         * Get tile link URL
         * @param {HTMLElement} tileWrapper - The .icon-grid-cell-wrapper element
         * @returns {string|null} - The link URL or null
         */
        getTileLink: function (tileWrapper) {
          return (
            tileWrapper.dataset.transitionLink ||
            tileWrapper.querySelector("a")?.href ||
            null
          );
        },
      };
    }

    // Register this grid instance
    window.iconGridUnlimited.grids.push({
      container: container,
      highlightCell: highlightCell,
      unhighlightCell: unhighlightCell,
    });
  }
})();
