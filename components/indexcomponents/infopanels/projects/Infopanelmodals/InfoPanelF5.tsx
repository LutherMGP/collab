// @/components/indexcomponents/infopanels/infopanelmodals/InfoPanelF5.tsx

import React from "react";
import InfoPanelBase from "./InfoPanelBase";

interface InfoPanelF5Props {
  projectId: string;
  userId: string;
  onClose: () => void;
}

const InfoPanelF5: React.FC<InfoPanelF5Props> = ({
  projectId,
  userId,
  onClose,
}) => {
  return (
    <InfoPanelBase
      projectId={projectId}
      userId={userId}
      category="f5"
      categoryName="Terms & Conditions"
      onClose={onClose}
    />
  );
};

export default InfoPanelF5;
