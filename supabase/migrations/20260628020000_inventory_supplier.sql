-- HUMAN-HUB — 在庫品目に「仕入先（どこで買うか）」を追加。
-- これにより発注時に仕入先が自動で引き継がれ、発注画面でも編集できる。
-- 何度流しても安全（IF NOT EXISTS）。

alter table inventory_items
  add column if not exists supplier text;
