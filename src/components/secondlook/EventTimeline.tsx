import React, { useState } from "react";
import { TimelineEventViewModel } from "@/types/ui";
import {
  Clock,
  UserCheck,
  Activity,
  WifiOff,
  CheckCircle2,
  FileEdit,
  ArrowUpDown,
  UserPlus,
  RefreshCw,
  BellRing,
} from "lucide-react";

export interface EventTimelineProps {
  events: TimelineEventViewModel[];
  patientId?: string;
  patientDisplayId?: string;
}

export function EventTimeline({
  events,
  patientId,
  patientDisplayId,
}: EventTimelineProps) {
  const [filterPatientOnly, setFilterPatientOnly] = useState(true);

  const displayedEvents = filterPatientOnly && patientId
    ? events.filter((e) => e.patientId === patientId)
    : events;

  const getEventIcon = (type: TimelineEventViewModel["type"]) => {
    switch (type) {
      case "arrival":
        return <UserPlus className="w-3.5 h-3.5 text-[#147D6F]" />;
      case "information-added":
        return <FileEdit className="w-3.5 h-3.5 text-[#4078A6]" />;
      case "information-confirmed":
        return <UserCheck className="w-3.5 h-3.5 text-[#2E8B72]" />;
      case "update-acknowledged":
        return <BellRing className="w-3.5 h-3.5 text-[#C78B25]" />;
      case "reassessment-requested":
        return <RefreshCw className="w-3.5 h-3.5 text-[#C78B25]" />;
      case "wearable-connected":
        return <Activity className="w-3.5 h-3.5 text-[#2E8B72]" />;
      case "wearable-disconnected":
        return <WifiOff className="w-3.5 h-3.5 text-[#C95C4A]" />;
      case "uncertainty-resolved":
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B72]" />;
      case "placement-overridden":
        return <ArrowUpDown className="w-3.5 h-3.5 text-[#C95C4A]" />;
    }
  };

  return (
    <div className="rounded-md border border-[#DCE5E2] bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F4F7F6]/60 border-b border-[#DCE5E2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#147D6F]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#60706C]">
            Audit & Clinical Event Timeline
          </h4>
        </div>

        {patientId && (
          <button
            type="button"
            onClick={() => setFilterPatientOnly(!filterPatientOnly)}
            className="text-[11px] text-[#147D6F] font-medium hover:underline"
          >
            {filterPatientOnly ? "Show All Queue Events" : `Case ${patientDisplayId} Only`}
          </button>
        )}
      </div>

      <div className="divide-y divide-[#F4F7F6] max-h-64 overflow-y-auto p-2">
        {displayedEvents.length > 0 ? (
          displayedEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-2.5 flex items-start gap-3 hover:bg-[#FAFBFB] rounded-sm transition-colors text-xs"
            >
              {/* Icon Bubble */}
              <div className="w-6 h-6 rounded-full bg-[#F4F7F6] border border-[#DCE5E2] flex items-center justify-center shrink-0 mt-0.5">
                {getEventIcon(evt.type)}
              </div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#132824] truncate">
                    {evt.title}
                  </span>
                  <span className="font-mono text-[10px] text-[#60706C] shrink-0">
                    {evt.timestamp}
                  </span>
                </div>

                <p className="text-[11px] text-[#60706C] mt-0.5 leading-relaxed">
                  {evt.description}
                </p>

                <div className="text-[10px] text-[#A8B6B2] mt-1 font-mono">
                  By: {evt.actor}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-[#60706C]">
            No recorded timeline events for this case.
          </div>
        )}
      </div>
    </div>
  );
}
