import { createContext, useContext, useState, ReactNode } from "react";

interface WizardState {
  awardCode: string;
  awardName: string;
  classificationId: string;
  classificationName: string;
  employmentType: string;
  shiftDate: Date | undefined;
  startTime: string;
  finishTime: string;
  breakMinutes: number;
  workedWeekend: boolean;
  usedOwnCar: boolean;
  workedLongHours: boolean;
  actualPaid: number;
}

interface WizardContextType {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  resetState: () => void;
}

const initialState: WizardState = {
  awardCode: "",
  awardName: "",
  classificationId: "",
  classificationName: "",
  employmentType: "",
  shiftDate: undefined,
  startTime: "",
  finishTime: "",
  breakMinutes: 0,
  workedWeekend: false,
  usedOwnCar: false,
  workedLongHours: false,
  actualPaid: 0,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    setState(initialState);
  };

  return (
    <WizardContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within WizardProvider");
  }
  return context;
}
