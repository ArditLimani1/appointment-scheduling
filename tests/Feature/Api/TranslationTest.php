<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TranslationTest extends TestCase
{
    use RefreshDatabase;

    public function test_translations_are_returned_for_supported_locale(): void
    {
        $response = $this->getJson('/api/v1/translations?locale=sq')->assertOk();

        $response->assertJsonPath('locale', 'sq');
        $this->assertIsArray($response->json('translations.common'));
        $this->assertIsArray($response->json('translations.employee'));
        $this->assertArrayNotHasKey('welcome', $response->json('translations'));
    }

    public function test_unsupported_locale_is_rejected(): void
    {
        $this->getJson('/api/v1/translations?locale=de')->assertStatus(422);
    }

    public function test_etag_returns_304_when_unchanged(): void
    {
        $first = $this->getJson('/api/v1/translations?locale=en')->assertOk();
        $etag = $first->headers->get('ETag');
        $this->assertNotNull($etag);

        $this->withHeaders(['If-None-Match' => $etag])
            ->getJson('/api/v1/translations?locale=en')
            ->assertStatus(304);
    }
}
