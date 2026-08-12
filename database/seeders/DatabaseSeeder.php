<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\DeliveryFee;
use App\Models\GalleryItem;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        StoreSetting::current();

        DeliveryFee::query()->updateOrCreate(
            ['name' => 'Windsor'],
            [
                'match_terms' => 'Windsor, N9A, N8X, N8W, N8Y, N9B, N9C, N9E, University Ave',
                'fee' => 8.00,
                'is_active' => true,
                'sort_order' => 0,
            ],
        );

        DeliveryFee::query()->updateOrCreate(
            ['name' => 'Tecumseh / Lakeshore'],
            [
                'match_terms' => 'Tecumseh, Lakeshore, N8N, N0R',
                'fee' => 12.00,
                'is_active' => true,
                'sort_order' => 0,
            ],
        );

        DeliveryFee::query()->updateOrCreate(
            ['name' => 'LaSalle / Amherstburg'],
            [
                'match_terms' => 'LaSalle, Amherstburg, N9J, N9V',
                'fee' => 14.00,
                'is_active' => true,
                'sort_order' => 0,
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'admin@ratalfoods.ca'],
            [
                'name' => 'Ratal Admin',
                'password' => 'password',
                'role' => UserRole::Admin,
            ]
        );

        $categoryIds = [
            'Nigerian Classics' => Category::query()->firstOrCreate(
                ['slug' => 'nigerian-classics'],
                ['name' => 'Nigerian Classics', 'sort_order' => 1],
            )->id,
            'Grilled & Spicy' => Category::query()->firstOrCreate(
                ['slug' => 'grilled-spicy'],
                ['name' => 'Grilled & Spicy', 'sort_order' => 3],
            )->id,
            'Sides & Extras' => Category::query()->firstOrCreate(
                ['slug' => 'sides-extras'],
                ['name' => 'Sides & Extras', 'sort_order' => 5],
            )->id,
        ];

        $portionVariation = [
            'name' => 'Portion',
            'options' => [
                ['value' => 'regular', 'label' => 'Regular', 'price_modifier' => 0],
                ['value' => 'large', 'label' => 'Large', 'price_modifier' => 5],
            ],
        ];

        $proteinVariation = [
            'name' => 'Protein',
            'options' => [
                ['value' => 'chicken', 'label' => 'Chicken', 'price_modifier' => 0],
                ['value' => 'beef', 'label' => 'Beef', 'price_modifier' => 2],
                ['value' => 'goat', 'label' => 'Goat', 'price_modifier' => 3],
            ],
        ];

        $spiceVariation = [
            'name' => 'Spice Level',
            'options' => [
                ['value' => 'mild', 'label' => 'Mild', 'price_modifier' => 0],
                ['value' => 'medium', 'label' => 'Medium', 'price_modifier' => 0],
                ['value' => 'hot', 'label' => 'Hot', 'price_modifier' => 0],
            ],
        ];

        $products = [
            [
                'name' => 'Jollof Rice & Grilled Chicken',
                'description' => 'Smoky party jollof served with flame-grilled chicken and plantain.',
                'price' => 24.99,
                'category' => 'Nigerian Classics',
                'category_id' => $categoryIds['Nigerian Classics'],
                'is_featured' => true,
                'image_url' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/ca61fad2b_generated_1f3b0921.png',
                'serves' => '1–2 people',
                'tags' => ['Nigerian Classics', 'Chef\'s Pick', 'Pickup Ready'],
                'variations' => [$portionVariation, $proteinVariation],
                'in_stock' => true,
            ],
            [
                'name' => 'Egusi Soup & Pounded Yam',
                'description' => 'Rich melon seed stew with assorted meat, served with smooth pounded yam.',
                'price' => 22.50,
                'category' => 'Nigerian Classics',
                'category_id' => $categoryIds['Nigerian Classics'],
                'is_featured' => true,
                'serves' => '1 person',
                'tags' => ['Nigerian Classics', 'Comfort Food', 'Pickup Ready'],
                'variations' => [$portionVariation, $proteinVariation],
                'in_stock' => true,
            ],
            [
                'name' => 'Suya Platter',
                'description' => 'Spiced grilled beef skewers with onions, tomatoes, and suya spice.',
                'price' => 18.00,
                'category' => 'Grilled & Spicy',
                'category_id' => $categoryIds['Grilled & Spicy'],
                'is_featured' => true,
                'serves' => '2 people',
                'tags' => ['Grilled & Spicy', 'Spicy', 'Shareable'],
                'variations' => [$portionVariation, $spiceVariation],
                'in_stock' => true,
            ],
            [
                'name' => 'Moi Moi',
                'description' => 'Steamed bean pudding with peppers and spices.',
                'price' => 8.50,
                'category' => 'Sides & Extras',
                'category_id' => $categoryIds['Sides & Extras'],
                'serves' => '1 person',
                'tags' => ['Sides & Extras', 'Vegetarian'],
                'variations' => [
                    [
                        'name' => 'Portion',
                        'options' => [
                            ['value' => 'single', 'label' => 'Single', 'price_modifier' => 0],
                            ['value' => 'double', 'label' => 'Double', 'price_modifier' => 3.5],
                        ],
                    ],
                ],
                'in_stock' => false,
            ],
        ];

        foreach ($products as $product) {
            Product::query()->updateOrCreate(
                ['name' => $product['name']],
                $product
            );
        }

        $galleryItems = [
            [
                'media_url' => '/images/about-us/about1.webp',
                'media_type' => 'image',
                'title' => 'Our Ingredients',
                'description' => 'We believe that the key to great food is great ingredients. That’s why we only use the freshest, highest-quality ingredients in all of our dishes.',
                'sort_order' => 1,
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'media_url' => '/images/about-us/about2.webp',
                'media_type' => 'image',
                'title' => 'Our Sustainability',
                'description' => 'We believe that good food should be good for the planet, too. We are committed to sustainability in everything we do.',
                'sort_order' => 2,
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'media_url' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/ca61fad2b_generated_1f3b0921.png',
                'media_type' => 'image',
                'title' => 'Gallery Item',
                'description' => null,
                'sort_order' => 3,
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'media_url' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png',
                'media_type' => 'image',
                'title' => 'Gallery Item',
                'description' => null,
                'sort_order' => 4,
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'media_url' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/2916511c5_generated_0ca42be0.png',
                'media_type' => 'image',
                'title' => 'Gallery Item',
                'description' => null,
                'sort_order' => 5,
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'media_url' => '/images/about-us/about1.webp',
                'media_type' => 'image',
                'title' => 'Gallery Item',
                'description' => null,
                'sort_order' => 6,
                'is_featured' => false,
                'is_active' => true,
            ],
        ];

        foreach ($galleryItems as $galleryItem) {
            GalleryItem::query()->updateOrCreate(
                ['media_url' => $galleryItem['media_url'], 'sort_order' => $galleryItem['sort_order']],
                $galleryItem
            );
        }

        $posts = [
            [
                'title' => 'The Art of Perfect Jollof Rice',
                'slug' => 'the-art-of-perfect-jollof-rice',
                'excerpt' => 'Discover how we build deep, smoky flavour in every batch of party-style jollof.',
                'content' => "Jollof rice is more than a dish at Ratal Foods — it is a celebration on a plate.\n\nWe slow-build flavour with peppers, tomatoes, and spices before the rice ever hits the pot, giving each serving that rich colour and aroma our guests love.",
                'image_url' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/ca61fad2b_generated_1f3b0921.png',
                'published_at' => now()->subDays(3),
                'is_published' => true,
            ],
            [
                'title' => 'What Makes Nigerian Suya So Special?',
                'slug' => 'what-makes-nigerian-suya-so-special',
                'excerpt' => 'From spice blend to grill technique, here is what goes into our suya platters.',
                'content' => "Suya is all about balance: heat, smoke, and texture.\n\nOur team marinates each skewer with a house spice mix and grills it to order so every bite stays juicy, bold, and unmistakably Nigerian.",
                'image_url' => 'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png',
                'published_at' => now()->subDays(7),
                'is_published' => true,
            ],
            [
                'title' => 'Meet Our Windsor Kitchen Team',
                'slug' => 'meet-our-windsor-kitchen-team',
                'excerpt' => 'The chefs and hospitality professionals behind every Ratal Foods order.',
                'content' => "Our kitchen brings together culinary training, food safety certification, and a shared love for Nigerian cuisine.\n\nWhether you are picking up lunch or planning a family feast, our team is here to make every order feel personal.",
                'published_at' => now()->subDays(12),
                'is_published' => true,
            ],
            [
                'title' => 'Seasonal Menu Highlights',
                'slug' => 'seasonal-menu-highlights',
                'excerpt' => 'A look at the dishes we are featuring this season at Ratal Foods.',
                'content' => "Each season gives us a chance to spotlight comforting classics and fresh favourites.\n\nStop by the menu to explore what is new, what is back by popular demand, and what pairs perfectly for your next gathering.",
                'published_at' => now()->subDays(18),
                'is_published' => true,
            ],
        ];

        foreach ($posts as $post) {
            BlogPost::query()->updateOrCreate(
                ['slug' => $post['slug']],
                $post
            );
        }
    }
}
