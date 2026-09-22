# Batch 10 — Tycoon UX / Information Architecture

## Product principle

Business Empire is a tycoon game. The company campus is the player's world; dashboards are supporting interfaces. Navigation should therefore have two equivalent entry paths:

1. **Spatial:** click the building that owns the function.
2. **Fast:** use the persistent bottom dock.

The player should not need to learn a taxonomy such as Management → Company Map → room → tab before they can act.

## Navigation model

### Campus
The default destination.

**Explore** is the normal mode. Clicking an existing building immediately opens its function. Dragging pans the campus.

**Manage campus** is explicitly entered when the player wants to alter the physical company: select rooms, staff them, rename them, assign product/category mandates, retool factories, construct or demolish.

### Bottom dock
Primary destinations:
- Campus
- Products
- People
- Market
- Finance
- More

`More` contains destinations that matter but are not constant minute-to-minute actions: Company HQ, Inventory, Distribution, Segments, Marketing and History.

### Contextual navigation
Once inside a functional area, only related local tabs are shown. For example Operations can expose Products / Inventory / Distribution without making Operations itself a global navigation concept the player must understand.

## Screen-by-screen intent

### Campus
Question: **Where is my company and what can I enter?**

Clicking a building navigates in Explore mode. Editing requires Manage campus, preventing navigation and construction interactions from competing for the same click.

### Products
Question: **What needs my attention right now?**

Portfolio health is shown before detail. Attention flags include no distribution, lost sales/stockouts, low stock cover and negative product margin. Products with issues sort upward. A Post-launch Product Study can be commissioned from the same screen.

### Finance
Question: **Why am I making or losing money?**

The first panel classifies the current situation using contribution, operating spend, profit, cash flow and working capital, before exposing deeper statements/analysis.

### Businesses
Question: **How are my different businesses doing relative to each other?**

Cards show revenue, product margin, products/brands, customers and key rivals. Engine-registry/debug information is deliberately removed from normal play.

### Company HQ
Question: **Where do I make company-level decisions?**

Strategy, Brands, Businesses and IP & Licensing live together as corporate functions rather than scattered global tabs.

### People / Market / History
These remain specialist screens reached directly from the dock or More. Their internal depth is retained, but they no longer participate in a nested global tab tree.

## Global HUD

The sticky HUD keeps only information useful almost everywhere: cash, quarterly profit, quarterly revenue, market share/change, investor confidence when applicable, simulation speed/date and save. Detailed financial or operational cards belong in their own screens.

## Non-goals

Batch 10 does not add new business systems, modify demand, rebalance difficulty or change the save schema. Major art/campus animation and game-feel celebrations remain Batch 11/12 work.
