{{-- Keep in sync with tailwind.config.js and STATUS_BADGE_BG in resources/js --}}
.badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 100px;
    font-size: 8px;
    font-weight: 700;
    text-transform: capitalize;
}
.badge-pending {
    background: #e0e3e5;
    color: #45464d;
}
.badge-confirmed {
    background: #6ffbbe;
    color: #002113;
}
.badge-cancelled {
    background: #ffdad6;
    color: #93000a;
}
