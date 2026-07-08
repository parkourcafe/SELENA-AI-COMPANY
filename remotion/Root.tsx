import { Still } from "remotion";
import { KoraLibraryVisual, KoraProcessVisual } from "./MarketingStills";

export function RemotionRoot() {
  return (
    <>
      <Still id="KoraProcessVisual" component={KoraProcessVisual} width={1600} height={1100} />
      <Still id="KoraLibraryVisual" component={KoraLibraryVisual} width={1500} height={1000} />
    </>
  );
}
