<?php

namespace App\Http\Controllers\Booking;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\GetAvailableSlotsRequest;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Models\Appointment;
use App\Services\Interfaces\BookingServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct(
        private BookingServiceInterface $bookingService,
    ) {}

    public function index(string $slug): Response
    {
        $data = $this->bookingService->getBookingPageData($slug);

        return Inertia::render('Booking/Index', $data);
    }

    public function getAvailableSlots(GetAvailableSlotsRequest $request, string $slug): JsonResponse
    {
        $slots = $this->bookingService->getAvailableSlots($slug, $request->validated());

        return response()->json(['slots' => $slots]);
    }

    public function store(StoreBookingRequest $request, string $slug): RedirectResponse
    {
        $appointment = $this->bookingService->createBooking($slug, $request->validated());

        return redirect()->route('booking.confirmation', $appointment);
    }

    public function confirmation(Appointment $appointment): Response
    {
        $data = $this->bookingService->getConfirmation($appointment);

        return Inertia::render('Booking/Confirmation', $data);
    }
}
