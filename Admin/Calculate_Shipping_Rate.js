router.post("/calculate-shipping-rate", async (req, res) => {
  try {
    const { destination, weight } = req.body;

    if (!destination || weight == null) {
      return res
        .status(400)
        .json({ message: "Destination and weight are required" });
    }

    const shippingRate = calculateShippingRate(destination, weight);
    res.status(200).json({ shippingRate });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating shipping rate",
      error: error.message,
    });
  }
});

// Shipping rate calculation function
function calculateShippingRate(destination, weight) {
  let rate;

  // Example shipping zones
  const rates = {
    domestic: 5.0,
    international: 15.0,
  };

  // Determine rate based on destination
  if (destination === "domestic") {
    rate = rates.domestic;
  } else if (destination === "international") {
    rate = rates.international;
  }

  // Additional charges based on weight
  if (weight > 1) {
    rate += (weight - 1) * 2;
  }

  return rate;
}
