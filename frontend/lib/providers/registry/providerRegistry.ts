import type { ProviderCapability } from "@/lib/providers/registry/providerCapabilities";
import { PROVIDER_CAPABILITIES, getProviderCapability } from "@/lib/providers/registry/providerCapabilities";

export const REGISTERED_PROVIDER_IDS = Object.keys(PROVIDER_CAPABILITIES);

export function listRegisteredProviders(): ProviderCapability[] {
  return REGISTERED_PROVIDER_IDS.map((id) => PROVIDER_CAPABILITIES[id]!);
}

export { getProviderCapability, PROVIDER_CAPABILITIES };
