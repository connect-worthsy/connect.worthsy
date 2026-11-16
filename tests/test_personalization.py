import unittest

from personalization_api.main import (
    CATALOGUE,
    GiftRequest,
    Preferences,
    RecommendRequest,
    SearchRequest,
    approved_affiliate_url,
    gift_finder,
    product_id,
    recommend,
    search,
)


class PersonalisationApiTests(unittest.TestCase):
    def test_catalogue_has_products_and_only_approved_links(self):
        self.assertGreater(len(CATALOGUE), 100)
        # Some sneaker records are searchable before their approved affiliate URL is available.
        # Blank links are permitted; every non-empty outbound link must be approved.
        self.assertTrue(all(not item["link"] or approved_affiliate_url(item["link"]) for item in CATALOGUE))
        self.assertTrue(any(not item["link"] and item["is_sneaker"] for item in CATALOGUE))

    def test_amazon_url_requires_worthsy_tag(self):
        self.assertTrue(approved_affiliate_url("https://www.amazon.in/dp/B09QN2KBRV?tag=worthsy0d-21"))
        self.assertFalse(approved_affiliate_url("https://www.amazon.in/dp/B09QN2KBRV"))
        self.assertFalse(approved_affiliate_url("https://example.com/product"))

    def test_search_finds_sneakers_by_synonym(self):
        result = search(SearchRequest(query="sneakers", limit=50))
        self.assertGreater(result["count"], 0)
        self.assertTrue(any(item["is_sneaker"] for item in result["items"]))

    def test_recommendation_explains_selected_brand(self):
        brand = next(item["brand"] for item in CATALOGUE if item.get("brand"))
        result = recommend(RecommendRequest(preferences=Preferences(favourite_brands=[brand]), limit=8))
        self.assertTrue(result["personalised"])
        self.assertTrue(any("favourite brands" in " ".join(item["reasons"]).lower() for item in result["items"]))

    def test_budget_does_not_treat_missing_price_as_under_budget(self):
        result = gift_finder(GiftRequest(occasion="gaming", budget_inr=1000, limit=8))
        self.assertIn("price_unverified", result)
        self.assertIn("Only products with a listed catalogue price", result["budget_note"])

    def test_product_ids_are_stable(self):
        product = CATALOGUE[0]
        self.assertEqual(product_id(product), product_id(product))


if __name__ == "__main__":
    unittest.main()
