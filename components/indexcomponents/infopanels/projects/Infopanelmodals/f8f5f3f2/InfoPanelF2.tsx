// @/components/indexcomponents/infopanels/projects/infopanelmodals/f8f5f3f2/InfoPanelF2.tsx

import React from "react";
import InfoPanelBase from "./InfoPanelBase";

interface InfoPanelF2Props {
  projectId: string;
  userId: string;
  onClose: () => void;
}

const InfoPanelF2: React.FC<InfoPanelF2Props> = ({
  projectId,
  userId,
  onClose,
}) => {
  return (
    <InfoPanelBase
      projectId={projectId}
      userId={userId}
      category="f2"
      categoryName="Partnership Agreement"
      onClose={onClose}
    />
  );
};

export default InfoPanelF2;