// Simple global state to track when returning from assignment screen
let returningFromAssignment = false;
let hasAssignmentChanges = false;

export const setJustReturnedFromAssignment = (value: boolean) => {
  returningFromAssignment = value;
};

export const getJustReturnedFromAssignment = () => {
  return returningFromAssignment;
};

export const setHasAssignmentChanges = (value: boolean) => {
  hasAssignmentChanges = value;
};

export const getHasAssignmentChanges = () => {
  return hasAssignmentChanges;
};

export const clearAssignmentState = () => {
  returningFromAssignment = false;
  hasAssignmentChanges = false;
};
