import { Still } from "remotion";
import { SelenaSystemsLibraryVisual, SelenaSystemsProcessVisual } from "./MarketingStills";

export function RemotionRoot() {
  return (
    <>
      <Still id="SelenaSystemsProcessVisual" component={SelenaSystemsProcessVisual} width={1600} height={1100} />
      <Still id="SelenaSystemsLibraryVisual" component={SelenaSystemsLibraryVisual} width={1500} height={1000} />
    </>
  );
}
