export interface OnCallShift {
  engineerName: string;
  contactEmail: string;
  escalationLevel: number;
}

/**
 * On-call rotations scheduler manager.
 */
export class OnCallScheduler {
  private shiftsList: OnCallShift[] = [
    { engineerName: 'Prajwal S', contactEmail: 'prajwal@oneinbox.ai', escalationLevel: 1 },
    { engineerName: 'Backend Lead', contactEmail: 'lead@oneinbox.ai', escalationLevel: 2 },
  ];

  /**
   * Retrieves active engineer shift by escalation hierarchy levels.
   */
  public getActiveEngineer(level = 1): OnCallShift {
    return this.shiftsList.find((s) => s.escalationLevel === level) || this.shiftsList[0];
  }
}
