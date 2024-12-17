// @/components/indexcomponents/infopanels/projects/infopanelmodals/f8f5f3f2/InfoPanelF3.tsx

import React from "react";
import InfoPanelBase from "./InfoPanelBase";

interface InfoPanelF3Props {
  projectId: string;
  userId: string;
  onClose: () => void;
}

const InfoPanelF3: React.FC<InfoPanelF3Props> = ({
  projectId,
  userId,
  onClose,
}) => {
  return (
    <InfoPanelBase
      projectId={projectId}
      userId={userId}
      category="f3"
      categoryName="Sustainability Report"
      onClose={onClose}
    />
  );
};

export default InfoPanelF3;