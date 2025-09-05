export const formatTime = (timeString: string) => {
  // Convert "08:00:00" to "8:00 AM"
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatDate = (dateString: string) => {
  // Convert "2024-04-20" to "Saturday, April 20"
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

export const getAvailabilityStatus = (
  playerCount: number,
  maxPlayers: number
) => {
  const availableSpots = maxPlayers - playerCount;

  if (availableSpots === 0) {
    return { status: "Full", color: "#dc2626", backgroundColor: "#fef2f2" };
  } else if (availableSpots === 1) {
    return { status: "1 Spot", color: "#ea580c", backgroundColor: "#fff7ed" };
  } else {
    return {
      status: `${availableSpots} Spots`,
      color: "#16a34a",
      backgroundColor: "#f0fdf4",
    };
  }
};
