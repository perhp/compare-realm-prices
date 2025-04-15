export const getPrices = async (
  auctionHouseAID: number,
  auctionHouseBID: number,
) => {
  const tokenBody = {
    client_id: "c260f00d-1071-409a-992f-dda2e5498536",
    grant_type: "api_token",
    scope: "app:realm-api app:pricing-api",
    token: process.env.TSM_API_KEY,
  };

  const { access_token } = await fetch(
    "https://auth.tradeskillmaster.com/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tokenBody),
    },
  ).then((response) => response.json());

  const [aItems, bItems] = await Promise.all([
    fetch(`https://pricing-api.tradeskillmaster.com/ah/${auctionHouseAID}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then((response) => response.json()),
    fetch(`https://pricing-api.tradeskillmaster.com/ah/${auctionHouseBID}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then((response) => response.json()),
  ]);

  return [aItems, bItems];
};
