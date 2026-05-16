import { config } from "./config.js";
import { proofRouteConfig } from "./bazaar.js";
import { logEvent } from "./observability.js";
import { SERVICE } from "./serviceInfo.js";

export async function maybeInstallX402(app) {
  if (!config.x402Enabled) {
    logEvent("debug", "x402.disabled");
    return false;
  }

  if (config.x402Mock) {
    installMockX402(app);
    logEvent("info", "x402.mock_installed", {
      path: SERVICE.paidPath,
      network: config.x402Network,
      price: config.x402Price
    });
    return true;
  }

  const { paymentMiddleware, x402ResourceServer } = await import("@x402/express");
  const { ExactEvmScheme } = await import("@x402/evm/exact/server");
  const { HTTPFacilitatorClient } = await import("@x402/core/server");

  const facilitatorClient = await createFacilitatorClient(HTTPFacilitatorClient);
  const server = new x402ResourceServer(facilitatorClient).register(config.x402Network, new ExactEvmScheme());

  app.use(paymentMiddleware(proofRouteConfig(), server));
  logEvent("info", "x402.middleware_installed", {
    network: config.x402Network,
    price: config.x402Price,
    facilitatorHost: new URL(config.facilitatorUrl).host
  });
  return true;
}

function installMockX402(app) {
  app.use(SERVICE.paidPath, (req, res, next) => {
    if (req.method !== "POST") return next();
    if (req.headers["x-payment"]) return next();

    return res.status(402).json({
      error: {
        code: "payment_required",
        message: "x402 payment is required for this Proof402 endpoint.",
        details: {
          scheme: "exact",
          network: config.x402Network,
          price: config.x402Price,
          payTo: config.payTo || null,
          mock: true
        }
      },
      accepts: proofRouteConfig()["POST /api/proof/notarize"].accepts
    });
  });
}

async function createFacilitatorClient(HTTPFacilitatorClient) {
  if (config.facilitatorUrl.includes("api.cdp.coinbase.com")) {
    try {
      const coinbase = await import("@coinbase/x402");
      if (coinbase.facilitator) {
        return new HTTPFacilitatorClient(coinbase.facilitator);
      }
    } catch {
      // Fall through to raw URL; startup validation still checks CDP credentials.
    }
  }

  return new HTTPFacilitatorClient({ url: config.facilitatorUrl });
}
