---
name: project-economy-constants
description: Where city_2048 economy/balance numbers actually live (not in balance.json)
metadata:
  type: project
---

city_2048 economy constants (coin costs, rewards, city unlock thresholds) are hardcoded as magic numbers in `src/scenes/GameScene.jsx`, NOT in `src/config/balance.json`. balance.json only holds tile numbers, spawn weights, and animation tuning.

Key locations: undo=80/remove=150/wand=220/continue=200 in GameScene.jsx handlers; shop bundle prices in `src/prefabs/ui.jsx` ShopPopup (~line 716); building reward `level * 10` in ui.jsx BuildingRewardPopup; `STREAK_REWARDS` daily array in ui.jsx (~line 856); `CITY_UNLOCK_THRESHOLDS` in GameScene.jsx (~line 28).

**Why:** Analyzed balance 2026-05-22; the file named balance.json misleadingly does not contain the spend/earn economy.
**How to apply:** When asked about balance tuning, check GameScene.jsx and ui.jsx, not just balance.json. Recommend consolidating constants into balance.json.

Known bug found 2026-05-22: shop displayed prices (undo5=250/wand3=300/remove3=270 in ui.jsx) do NOT match actual deductions in `handleShopPurchase` (320/560/380). Verify before citing — may be fixed.
