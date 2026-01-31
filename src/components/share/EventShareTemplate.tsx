"use client";

import { forwardRef } from "react";
import { getSportEmoji } from "@/lib/share/sportEmojis";
import { formatShortAddress } from "@/lib/formatAddress";

export type ShareTemplateType = "upcoming" | "completed";

type EventShareTemplateProps = {
  templateType: ShareTemplateType;
  eventTitle: string;
  sportType: string;
  datetime: string;
  location: string;
  hostName: string;
};

const EventShareTemplate = forwardRef<HTMLDivElement, EventShareTemplateProps>(
  function EventShareTemplate(
    { templateType, eventTitle, sportType, datetime, location, hostName },
    ref
  ) {
    const sportEmoji = getSportEmoji(sportType);
    const date = new Date(datetime);

    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const isUpcoming = templateType === "upcoming";

    // Format location to be concise
    const shortLocation = formatShortAddress(location);

    return (
      <div
        ref={ref}
        style={{
          width: "1080px",
          height: "1920px",
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
        }}
        className="flex flex-col items-center justify-center text-white"
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isUpcoming
              ? "linear-gradient(135deg, #059669 0%, #0d9488 50%, #06b6d4 100%)"
              : "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
          }}
        />

        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "120px",
            right: "80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "200px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "80px",
            width: "100%",
          }}
        >
          {/* Sport emoji */}
          <div
            style={{
              fontSize: "200px",
              marginBottom: "40px",
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            {!isUpcoming && (
              <span style={{ fontSize: "160px" }}>🏆</span>
            )}
            <span>{sportEmoji}</span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              marginBottom: "60px",
              textAlign: "center",
              textShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {isUpcoming ? '"Join Me For..."' : '"We Did It!"'}
          </div>

          {/* Divider */}
          <div
            style={{
              width: "600px",
              height: "4px",
              background: "rgba(255,255,255,0.4)",
              borderRadius: "2px",
              marginBottom: "60px",
            }}
          />

          {/* Event title */}
          <div
            style={{
              fontSize: "80px",
              fontWeight: "bold",
              marginBottom: "48px",
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: "1.2",
            }}
          >
            {eventTitle}
          </div>

          {/* Event details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              marginBottom: "60px",
            }}
          >
            {isUpcoming ? (
              <>
                <div
                  style={{
                    fontSize: "48px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <span>📅</span>
                  <span>
                    {formattedDate} · {formattedTime}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "48px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <span>📍</span>
                  <span>{shortLocation}</span>
                </div>
                <div
                  style={{
                    fontSize: "48px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <span>👤</span>
                  <span>Hosted by {hostName || "Event Host"}</span>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: "48px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <span>🎉</span>
                  <span>Great session!</span>
                </div>
                <div
                  style={{
                    fontSize: "48px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <span>📅</span>
                  <span>Completed {formattedDate}</span>
                </div>
                <div
                  style={{
                    fontSize: "48px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <span>📍</span>
                  <span>{shortLocation}</span>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              width: "600px",
              height: "4px",
              background: "rgba(255,255,255,0.4)",
              borderRadius: "2px",
              marginBottom: "60px",
            }}
          />

          {/* Branding */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                letterSpacing: "4px",
              }}
            >
              MatUp
            </div>
            <div
              style={{
                fontSize: "36px",
                opacity: 0.9,
              }}
            >
              Find your fitness partner
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default EventShareTemplate;
