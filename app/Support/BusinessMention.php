<?php

namespace App\Support;

class BusinessMention
{
    /**
     * Albanian uses "tek" before a vowel and "te" before a consonant, so the
     * phrase has to be picked from the business name itself.
     */
    private const VOWELS = ['a', 'e', 'ë', 'i', 'o', 'u', 'y'];

    /**
     * Localised "at <business>" phrase — "te Klinika Altini", "tek Aura" or
     * "with Aura". Returns an empty string when there is no name, so callers
     * can drop the phrase from the sentence entirely.
     */
    public static function at(?string $name): string
    {
        $name = trim((string) $name);

        if ($name === '') {
            return '';
        }

        $key = self::startsWithVowel($name)
            ? 'mail.at_business_vowel'
            : 'mail.at_business';

        return __($key, ['business' => $name]);
    }

    private static function startsWithVowel(string $name): bool
    {
        return in_array(mb_strtolower(mb_substr($name, 0, 1)), self::VOWELS, true);
    }
}
