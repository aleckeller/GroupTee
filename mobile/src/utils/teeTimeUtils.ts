import { TeeTime } from "../types";

export const groupTeeTimesByWeekend = (teeTimes: TeeTime[]) => {
  const grouped: {
    [key: string]: { weekend: TeeTime["weekends"]; teeTimes: TeeTime[] };
  } = {};

  teeTimes.forEach((teeTime) => {
    const weekendKey = teeTime.weekend_id;
    if (!grouped[weekendKey]) {
      grouped[weekendKey] = {
        weekend: teeTime.weekends,
        teeTimes: [],
      };
    }
    grouped[weekendKey].teeTimes.push(teeTime);
  });

  return grouped;
};
