import { Still } from "remotion";
import { SelenaSystemsLibraryVisual, SelenaSystemsProcessVisual } from "./MarketingStills";
import {
  AuditServiceFrame,
  AutomationServiceFrame,
  ConciergeServiceFrame,
  ContentServiceFrame,
  KnowledgeServiceFrame,
  PackagingServiceFrame,
  SupportServiceFrame,
  TrainingServiceFrame,
} from "./ServiceStills";

export function RemotionRoot() {
  return (
    <>
      <Still id="SelenaSystemsProcessVisual" component={SelenaSystemsProcessVisual} width={1600} height={1100} />
      <Still id="SelenaSystemsLibraryVisual" component={SelenaSystemsLibraryVisual} width={1500} height={1000} />
      <Still id="AuditServiceFrame" component={AuditServiceFrame} width={1200} height={760} />
      <Still id="TrainingServiceFrame" component={TrainingServiceFrame} width={1200} height={760} />
      <Still id="AutomationServiceFrame" component={AutomationServiceFrame} width={1200} height={760} />
      <Still id="ContentServiceFrame" component={ContentServiceFrame} width={1200} height={760} />
      <Still id="ConciergeServiceFrame" component={ConciergeServiceFrame} width={1200} height={760} />
      <Still id="KnowledgeServiceFrame" component={KnowledgeServiceFrame} width={1200} height={760} />
      <Still id="PackagingServiceFrame" component={PackagingServiceFrame} width={1200} height={760} />
      <Still id="SupportServiceFrame" component={SupportServiceFrame} width={1200} height={760} />
    </>
  );
}
