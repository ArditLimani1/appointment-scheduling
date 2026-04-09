<?php

namespace Database\Seeders;

use App\Models\BusinessTypeCategory;
use Illuminate\Database\Seeder;

class BusinessTypeSeeder extends Seeder
{
    /**
     * Seed default categories and business types. Add or edit rows in
     * business_type_categories and business_types anytime to extend the registration dropdown.
     */
    public function run(): void
    {
        $catalog = [
            ['name' => 'Beauty & personal care', 'sort_order' => 10, 'types' => [
                ['name' => 'Barbershop', 'sort_order' => 10],
                ['name' => 'Hair salon', 'sort_order' => 20],
                ['name' => 'Nail salon', 'sort_order' => 30],
                ['name' => 'Spa & massage', 'sort_order' => 40],
                ['name' => 'Tanning / solarium', 'sort_order' => 50],
                ['name' => 'Brows & lashes', 'sort_order' => 60],
                ['name' => 'Makeup artist', 'sort_order' => 70],
                ['name' => 'Tattoo & piercing studio', 'sort_order' => 80],
            ]],
            ['name' => 'Health & medical', 'sort_order' => 20, 'types' => [
                ['name' => 'Dentistry', 'sort_order' => 10],
                ['name' => 'Physiotherapy', 'sort_order' => 20],
                ['name' => 'Psychology / counseling', 'sort_order' => 30],
                ['name' => 'Chiropractic', 'sort_order' => 40],
                ['name' => 'Medical aesthetics', 'sort_order' => 50],
                ['name' => 'Optometry / eye care', 'sort_order' => 60],
                ['name' => 'Podiatry', 'sort_order' => 70],
            ]],
            ['name' => 'Fitness & wellness', 'sort_order' => 30, 'types' => [
                ['name' => 'Personal training', 'sort_order' => 10],
                ['name' => 'Yoga / Pilates studio', 'sort_order' => 20],
                ['name' => 'Nutrition coaching', 'sort_order' => 30],
            ]],
            ['name' => 'Professional & coaching', 'sort_order' => 40, 'types' => [
                ['name' => 'Tutoring / education', 'sort_order' => 10],
                ['name' => 'Life / career coaching', 'sort_order' => 20],
                ['name' => 'Legal (by appointment)', 'sort_order' => 30],
                ['name' => 'Financial advisory', 'sort_order' => 40],
            ]],
            ['name' => 'Other services', 'sort_order' => 50, 'types' => [
                ['name' => 'Pet grooming', 'sort_order' => 10],
                ['name' => 'Automotive detailing', 'sort_order' => 20],
                ['name' => 'Photography / studio', 'sort_order' => 30],
                ['name' => 'Other', 'sort_order' => 100],
            ]],
        ];

        foreach ($catalog as $cat) {
            $types = $cat['types'];
            unset($cat['types']);
            $category = BusinessTypeCategory::query()->create($cat);
            foreach ($types as $type) {
                $category->businessTypes()->create($type);
            }
        }
    }
}
