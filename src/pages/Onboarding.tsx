import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/new-check-step-1");
  }, [navigate]);

  return null;
};

export default Onboarding;
