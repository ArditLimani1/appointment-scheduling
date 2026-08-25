<?php

return [

    'shared' => [
        'head_title' => 'Initial setup',
        'eyebrow' => 'Initial setup',
        'step_label' => 'Step :current of :total',
        'back' => 'Back',
        'continue' => 'Continue',
        'finish' => 'Finish setup',
        'saving' => 'Saving…',
        'logout' => 'Sign out',
        'helper_required' => 'You can change these later from Settings.',
    ],

    'admin' => [
        'hero_title' => "Welcome! Let's set up your business.",
        'hero_subtitle' => 'A few quick steps to define your booking rules and how you work. None of these are permanent, you can change them at any time from Settings.',
        'progress_complete' => 'Setup complete',

        'step_rules_title' => 'Booking rules',
        'step_rules_sub' => 'Define the slot interval, minimum notice and the booking window.',
        'slot_duration_title' => 'Slot duration',
        'slot_duration_help' => 'Minimum interval between available slots (in minutes).',
        'min_notice_title' => 'Minimum notice',
        'min_notice_help' => 'How many minutes ahead a client must book.',
        'booking_window_title' => 'Booking window',
        'booking_window_help' => 'How many days ahead clients can pick a slot.',
        'unit_min' => 'min',
        'unit_days' => 'days',

        'step_client_title' => 'Client identification & notifications',
        'step_client_sub' => 'Choose whether clients book with phone or email, which also decides how updates and notifications reach them.',
        'client_phone' => 'Phone',
        'client_phone_desc' => 'Clients enter their phone number when booking.',
        'client_email' => 'Email',
        'client_email_desc' => 'Clients enter their email address when booking.',

        'step_automation_title' => 'Automations',
        'step_automation_sub' => 'Decide whether online bookings confirm themselves and whether clients get an automatic reminder.',

        'auto_confirm_title' => 'Auto-confirm appointments',
        'auto_confirm_help' => 'When on, online bookings are confirmed immediately and the client is notified straight away. When off, new bookings stay pending until someone confirms them manually.',
        'auto_confirm_label' => 'Confirm online bookings automatically',

        'reminders_title_phone' => 'Automatic WhatsApp reminders',
        'reminders_title_email' => 'Automatic email reminders',
        'reminders_help_phone' => 'When on, clients with a confirmed appointment today automatically receive a WhatsApp reminder at the time you choose. The channel follows the client identification you picked, so it changes to email if you switch to email.',
        'reminders_help_email' => 'When on, clients with a confirmed appointment today automatically receive an email reminder at the time you choose. The channel follows the client identification you picked, so it changes to WhatsApp if you switch to phone.',
        'reminders_label_phone' => 'Send a WhatsApp reminder on the day of the appointment',
        'reminders_label_email' => 'Send an email reminder on the day of the appointment',
        'reminder_time_label' => 'Reminder time',

        'step_operations_title' => 'Operating preferences',
        'step_operations_sub' => 'A few last preferences for how you work and how you manage shared resources.',

        'step_staff_title' => "I'm part of the staff",
        'step_staff_sub' => 'Enable this if you also provide services and want to be bookable.',
        'staff_toggle_label' => 'Show me on the booking page',
        'staff_toggle_help' => 'You can change this later in Configuration.',

        'step_solo_title' => 'Only one employee',
        'step_solo_sub' => 'Turn this on if you are both the admin and the only person who takes appointments. You will not switch between Admin and Employee views.',
        'solo_toggle_label' => 'I am the only employee and the admin',
        'staff_locked_title' => 'Cannot turn this off',
        'staff_locked_body' => 'While “only one employee” is on, you stay listed as staff. Turn that option off first.',

        'step_service_title' => 'Allow staff to change service',
        'step_service_sub' => 'Decide whether staff can change the service after a booking.',
        'service_edit_label' => 'Let staff edit the service of an appointment',
        'service_edit_help' => 'When disabled, staff can only change the date and time.',

        'step_resources_title' => 'Shared resources',
        'step_resources_sub' => 'Enable this if appointments depend on shared rooms, chairs, devices, or other equipment with limited capacity.',
        'resources_label' => 'Enable shared resources management',
        'resources_help' => 'When enabled, you can create shared rooms or equipment, attach them to services, and the calendar will block overbooking automatically.',
    ],

    'employee' => [
        'hero_title' => 'Welcome to the team!',
        'hero_subtitle' => 'Let’s set up your personal booking address and your standard weekly schedule. None of these are permanent, you can change them at any time from Settings.',
        'progress_complete' => 'Setup complete',

        'step_url_title' => 'Your profile',
        'step_url_sub' => 'Confirm your basic details and choose the personal URL clients will use to find you.',
        'business_name_label' => 'Business',
        'email_label' => 'Your email',
        'business_url_label' => 'Business booking URL',
        'personal_url_label' => 'Your personal booking URL',
        'personal_url_placeholder' => 'your-name',
        'copy_url' => 'Copy URL',

        'step_schedule_title' => 'Standard weekly schedule',
        'step_schedule_sub' => 'Toggle the days you work and add your breaks. You can adjust this later.',
        'day_off' => 'Day off',
        'from' => 'From',
        'to' => 'To',
        'break' => 'Break',
        'add_break' => 'Add break',
        'remove_break' => 'Remove break',
        'edit_break' => 'Edit break',
        'add_break_title' => 'Add break',
        'edit_break_title' => 'Edit break',
        'start_time' => 'Start time',
        'end_time' => 'End time',
        'cancel' => 'Cancel',
        'save_break' => 'Save break',
        'end_after_start' => 'End time must be after start time.',
        'weekday_0' => 'Monday',
        'weekday_1' => 'Tuesday',
        'weekday_2' => 'Wednesday',
        'weekday_3' => 'Thursday',
        'weekday_4' => 'Friday',
        'weekday_5' => 'Saturday',
        'weekday_6' => 'Sunday',
    ],

];
