// @/components/indexcomponents/infopanels/duediligence/infopanelmodals/f8f5f3f2/InfoPanelF8.tsx

import React from "react";
import InfoPanelBase from "./InfoPanelBase";

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