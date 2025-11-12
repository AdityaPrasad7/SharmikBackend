import { CoinPackage, CoinRule } from "../../../models/admin/coinPricing/coinPricing.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const toDTO = (coinPackage) => ({
  id: coinPackage._id.toString(),
  name: coinPackage.name,
  coins: coinPackage.coins,
  price: {
    amount: coinPackage.price.amount,
    currency: coinPackage.price.currency,
  },
  isVisible: coinPackage.isVisible,
  createdAt: coinPackage.createdAt,
  updatedAt: coinPackage.updatedAt,
});

const mapRule = (rule) => ({
  coinCostPerApplication: rule?.coinCostPerApplication ?? 0,
  coinPerEmployeeCount: rule?.coinPerEmployeeCount ?? 0,
});

const buildRuleUpdate = (body = {}) => {
  const update = {};
  if (body.coinCostPerApplication !== undefined) {
    update.coinCostPerApplication = body.coinCostPerApplication;
  }
  if (body.coinPerEmployeeCount !== undefined) {
    update.coinPerEmployeeCount = body.coinPerEmployeeCount;
  }
  return update;
};

export const getCoinPricing = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const [packages, rule] = await Promise.all([
    CoinPackage.find({ category }).sort({ coins: 1 }),
    CoinRule.findOne({ category }),
  ]);

  res.status(200).json(
    ApiResponse.success({
      packages: packages.map(toDTO),
      rules: mapRule(rule),
    })
  );
});

export const createCoinPackage = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { name, coins, price, isVisible = true } = req.body;

  const existing = await CoinPackage.findOne({ category, name: name.trim() });
  if (existing) {
    throw new ApiError(409, "A package with this name already exists in the selected category");
  }

  const coinPackage = await CoinPackage.create({
    category,
    name: name.trim(),
    coins,
    price: { amount: price, currency: "INR" },
    isVisible,
  });

  res
    .status(201)
    .json(ApiResponse.success({ package: toDTO(coinPackage) }, "Coin package created successfully"));
});

export const updateCoinPackage = asyncHandler(async (req, res) => {
  const { category, packageId } = req.params;
  const { name, coins, price, isVisible } = req.body;

  const coinPackage = await CoinPackage.findOne({ _id: packageId, category });
  if (!coinPackage) {
    throw new ApiError(404, "Coin package not found");
  }

  if (name && name.trim() !== coinPackage.name) {
    const duplicate = await CoinPackage.findOne({ category, name: name.trim(), _id: { $ne: packageId } });
    if (duplicate) {
      throw new ApiError(409, "Another package with this name already exists");
    }
    coinPackage.name = name.trim();
  }

  if (coins !== undefined) {
    coinPackage.coins = coins;
  }

  if (price !== undefined) {
    coinPackage.price.amount = price;
  }

  if (isVisible !== undefined) {
    coinPackage.isVisible = isVisible;
  }

  await coinPackage.save();

  res
    .status(200)
    .json(ApiResponse.success({ package: toDTO(coinPackage) }, "Coin package updated successfully"));
});

export const deleteCoinPackage = asyncHandler(async (req, res) => {
  const { category, packageId } = req.params;

  const coinPackage = await CoinPackage.findOneAndDelete({ _id: packageId, category });
  if (!coinPackage) {
    throw new ApiError(404, "Coin package not found");
  }

  res.status(200).json(ApiResponse.success(null, "Coin package deleted successfully"));
});

export const updateCoinRules = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const payload = buildRuleUpdate(req.body);

  if (!Object.keys(payload).length) {
    throw new ApiError(400, "No rule fields provided to update");
  }

  const rule = await CoinRule.findOneAndUpdate(
    { category },
    payload,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res
    .status(200)
    .json(ApiResponse.success({ rules: mapRule(rule) }, "Coin rules updated successfully"));
});
