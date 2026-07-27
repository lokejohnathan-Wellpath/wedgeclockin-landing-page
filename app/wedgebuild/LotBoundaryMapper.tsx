"use client";

import type { MouseEvent } from "react";

export type LotPoint = { x: number; y: number };

type Props = {
  imageUrl: string | null;
  points: LotPoint[];
  confirmed: boolean;
  onPointsChange: (points: LotPoint[]) => void;
  onConfirmedChange: (confirmed: boolean) => void;
};

export default function LotBoundaryMapper({
  imageUrl,
  points,
  confirmed,
  onPointsChange,
  onConfirmedChange,
}: Props) {
  function addPoint(event: MouseEvent<SVGSVGElement>) {
    if (!imageUrl || confirmed || points.length >= 30) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    onPointsChange([...points, { x, y }]);
  }

  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="wb-boundary-mapper">
      <div className="wb-mapper-head">
        <div>
          <span>LAND-PLAN CALIBRATION</span>
          <h3>{imageUrl ? "Confirm the actual lot boundary" : "Attach a survey or site plan"}</h3>
        </div>
        <b className={confirmed ? "confirmed" : ""}>{confirmed ? "OWNER CONFIRMED" : "NOT CONFIRMED"}</b>
      </div>

      <div className={`wb-map-canvas ${imageUrl ? "" : "is-empty"}`}>
        {imageUrl ? (
          <>
            {/* Blob URLs cannot be handled by next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Uploaded Malaysian land or survey plan" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" onClick={addPoint}>
              {points.length >= 2 && <polyline points={polygon} fill="none" stroke="#df8e37" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />}
              {points.length >= 3 && <polygon points={polygon} fill="rgba(45,114,103,.18)" stroke="#df8e37" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
              {points.map((point, index) => (
                <g key={`${point.x}-${point.y}`}>
                  <circle cx={point.x} cy={point.y} r="2.1" fill="#fffdf8" stroke="#bd6f27" strokeWidth=".8" vectorEffect="non-scaling-stroke" />
                  <text x={point.x} y={point.y - 3.2} textAnchor="middle" fill="#173b35" fontSize="4" fontWeight="800">{index + 1}</text>
                </g>
              ))}
            </svg>
            {!confirmed && (
              <div className="wb-map-instruction">
                Start at one end of the road-facing boundary, then click every lot corner in order. Minimum 3 points; maximum 30.
              </div>
            )}
          </>
        ) : (
          <div>
            <span>⌁</span>
            <p>The plan itself must be visible before WedgeBuild can map its shape.</p>
          </div>
        )}
      </div>

      <div className="wb-mapper-actions">
        <p>
          {points.length
            ? `${points.length} boundary points marked. ${points.length < 3 ? "Add more corners." : "Check every edge before confirming."}`
            : "No geometry has been read or confirmed yet."}
        </p>
        {points.length > 0 && (
          <button
            type="button"
            className="wb-secondary"
            onClick={() => {
              onPointsChange([]);
              onConfirmedChange(false);
            }}
          >
            Trace again
          </button>
        )}
        <button
          type="button"
          className="wb-primary"
          disabled={points.length < 3 || confirmed}
          onClick={() => onConfirmedChange(true)}
        >
          {confirmed ? "Boundary confirmed" : "Confirm this lot"}
        </button>
      </div>
    </div>
  );
}
