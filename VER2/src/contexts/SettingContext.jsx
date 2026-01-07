import { createContext, useEffect, useState } from "react";
import settingService from "../services/settingService";

export const SettingContext = createContext(null);

export const SettingProvider = ({ children }) => {
  const [setting, setSetting] = useState(null);

  useEffect(() => {
    const fetchSetting = async () => {
      const res = await settingService.getGeneralSetting();
      console.log("SETTING API RESPONSE:", res);
      if (res.success) {
        setSetting(res.data);
      }
    };

    fetchSetting();
  }, []);

  return (
    <SettingContext.Provider value={setting}>
      {children}
    </SettingContext.Provider>
  );
};