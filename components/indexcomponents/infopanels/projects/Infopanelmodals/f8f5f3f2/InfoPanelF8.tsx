// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelF8.tsx

import React from "react";
import InfoPanelBase from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelBase";

interface InfoPanelF8Props {
  projectId: string;
  userId: string;
  onClose: () => void;
}

const InfoPanelF8: React.FC<InfoPanelF8Props> = ({
  projectId,
  userId,
  onClose,
}) => {
  return (
    <InfoPanelBase
      projectId={projectId}
      userId={userId}
      category="f8"
      categoryName="Specification"
      onClose={onClose}
    />
  );
};

export default InfoPanelF8;
