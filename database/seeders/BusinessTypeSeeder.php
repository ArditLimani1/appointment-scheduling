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
            ['name' => 'Beauty & personal care', 'name_sq' => 'Bukuri dhe kujdes personal', 'sort_order' => 10, 'types' => [
                ['name' => 'Barbershop', 'name_sq' => 'Berber', 'sort_order' => 10],
                ['name' => 'Hair salon', 'name_sq' => 'Sallon flokësh', 'sort_order' => 20],
                ['name' => 'Nail salon', 'name_sq' => 'Sallon thonjsh', 'sort_order' => 30],
                ['name' => 'Spa & massage', 'name_sq' => 'Spa dhe masazh', 'sort_order' => 40],
                ['name' => 'Tanning / solarium', 'name_sq' => 'Solarium / bronzim', 'sort_order' => 50],
                ['name' => 'Brows & lashes', 'name_sq' => 'Vetulla dhe qerpikë', 'sort_order' => 60],
                ['name' => 'Makeup artist', 'name_sq' => 'Artiste grim', 'sort_order' => 70],
                ['name' => 'Tattoo & piercing studio', 'name_sq' => 'Studio tatuazhesh dhe piercing', 'sort_order' => 80],
            ]],
            ['name' => 'Health & medical', 'name_sq' => 'Shëndet dhe mjekësi', 'sort_order' => 20, 'types' => [
                ['name' => 'Dentistry', 'name_sq' => 'Stomatologji', 'sort_order' => 10],
                ['name' => 'Physiotherapy', 'name_sq' => 'Fizioterapi', 'sort_order' => 20],
                ['name' => 'Psychology / counseling', 'name_sq' => 'Psikologji / këshillim', 'sort_order' => 30],
                ['name' => 'Chiropractic', 'name_sq' => 'Kiropraktikë', 'sort_order' => 40],
                ['name' => 'Medical aesthetics', 'name_sq' => 'Estetikë mjekësore', 'sort_order' => 50],
                ['name' => 'Optometry / eye care', 'name_sq' => 'Optometri / kujdes për sy', 'sort_order' => 60],
                ['name' => 'Podiatry', 'name_sq' => 'Podologji', 'sort_order' => 70],
            ]],
            ['name' => 'Fitness & wellness', 'name_sq' => 'Fitness dhe mirëqenie', 'sort_order' => 30, 'types' => [
                ['name' => 'Personal training', 'name_sq' => 'Trajnim personal', 'sort_order' => 10],
                ['name' => 'Yoga / Pilates studio', 'name_sq' => 'Studio yoga / pilates', 'sort_order' => 20],
                ['name' => 'Nutrition coaching', 'name_sq' => 'Këshillim ushqimor', 'sort_order' => 30],
            ]],
            ['name' => 'Professional & coaching', 'name_sq' => 'Profesionale dhe këshillim', 'sort_order' => 40, 'types' => [
                ['name' => 'Tutoring / education', 'name_sq' => 'Mësime private / arsim', 'sort_order' => 10],
                ['name' => 'Life / career coaching', 'name_sq' => 'Këshillim për jetë / karrierë', 'sort_order' => 20],
                ['name' => 'Legal (by appointment)', 'name_sq' => 'Shërbime ligjore (me termin)', 'sort_order' => 30],
                ['name' => 'Financial advisory', 'name_sq' => 'Këshillim financiar', 'sort_order' => 40],
            ]],
            ['name' => 'Other services', 'name_sq' => 'Shërbime të tjera', 'sort_order' => 50, 'types' => [
                ['name' => 'Pet grooming', 'name_sq' => 'Kujdes për kafshë shtëpiake', 'sort_order' => 10],
                ['name' => 'Automotive detailing', 'name_sq' => 'Detajim automjetesh', 'sort_order' => 20],
                ['name' => 'Photography / studio', 'name_sq' => 'Fotografi / studio', 'sort_order' => 30],
                ['name' => 'Other', 'name_sq' => 'Tjetër', 'sort_order' => 100],
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
