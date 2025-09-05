export type Player = {
  id: string;
  full_name: string;
};

export type TeeTime = {
  id: string;
  tee_date: string;
  tee_time: string;
  weekend_id: string;
  group_id: string;
  max_players: number;
  created_at: string;
  players?: Player[];
  weekends: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
};

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
