<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SafetyAlert;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripMatch;
use App\Models\TrustLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ViajauController extends Controller
{
    public function health()
    {
        return response()->json([
            'status' => 'ok',
            'app' => 'ViajaU',
            'mode' => 'backend-foundation',
            'moment' => now()->toISOString(),
        ]);
    }

    public function registerStudent(Request $request)
    {
        $data = Validator::make($request->all(), [
            'name' => 'required|string|max:120',
            'email' => 'required|email',
            'university' => 'required|string',
            'career' => 'nullable|string',
            'semester' => 'nullable|string',
            'shift' => 'nullable|string',
            'neighborhood' => 'nullable|string',
            'transport' => 'nullable|string',
            'emergency_contact' => 'nullable|string',
            'privacy' => 'nullable|string',
        ])->validate();

        $profile = StudentProfile::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'university' => $data['university'],
            'career' => $data['career'] ?? 'Ingeniería de Sistemas',
            'semester' => $data['semester'] ?? '8vo',
            'shift' => $data['shift'] ?? 'Nocturna',
            'neighborhood' => $data['neighborhood'] ?? 'El Caney',
            'transport' => $data['transport'] ?? 'MIO + caminata',
            'emergency_contact' => $data['emergency_contact'] ?? 'Contacto de confianza',
            'privacy' => $data['privacy'] ?? 'Zona aproximada',
            'verified' => true,
            'trust_score' => 4.8,
            'status' => 'activo',
        ]);

        return response()->json([
            'message' => 'Estudiante registrado correctamente.',
            'data' => $profile,
        ], 201);
    }

    public function showStudent(string $id)
    {
        $profile = StudentProfile::findOrFail($id);

        return response()->json(['data' => $profile]);
    }

    public function updateProfile(Request $request, string $id)
    {
        $profile = StudentProfile::findOrFail($id);

        $profile->fill($request->only([
            'name',
            'email',
            'university',
            'career',
            'semester',
            'shift',
            'neighborhood',
            'transport',
            'emergency_contact',
            'privacy',
            'verified',
            'trust_score',
            'status',
        ]));

        $profile->save();

        return response()->json([
            'message' => 'Perfil actualizado.',
            'data' => $profile,
        ]);
    }

    public function listTrips()
    {
        return response()->json([
            'data' => TravelOffer::orderByDesc('created_at')->get(),
        ]);
    }

    public function createTrip(Request $request)
    {
        $data = Validator::make($request->all(), [
            'student_profile_id' => 'required|exists:student_profiles,id',
            'origin' => 'required|string',
            'destination' => 'required|string',
            'mode' => 'nullable|string',
            'departure_time' => 'nullable|string',
            'seats' => 'nullable|integer|min:1',
            'cost' => 'nullable|string',
            'status' => 'nullable|string',
        ])->validate();

        $trip = TravelOffer::create([
            'student_profile_id' => $data['student_profile_id'],
            'origin' => $data['origin'],
            'destination' => $data['destination'],
            'mode' => $data['mode'] ?? 'MIO + caminata',
            'departure_time' => $data['departure_time'] ?? '19:45',
            'seats' => $data['seats'] ?? 2,
            'cost' => $data['cost'] ?? '2500 COP',
            'status' => $data['status'] ?? 'oferta-activa',
        ]);

        return response()->json([
            'message' => 'Oferta de viaje creada.',
            'data' => $trip,
        ], 201);
    }

    public function listMatches()
    {
        return response()->json([
            'data' => TripMatch::orderByDesc('score')->get(),
        ]);
    }

    public function createMatch(Request $request)
    {
        $data = Validator::make($request->all(), [
            'student_profile_id' => 'required|exists:student_profiles,id',
            'matched_student_id' => 'required|exists:student_profiles,id',
            'score' => 'required|numeric|min:0|max:100',
            'zone' => 'nullable|string',
            'time' => 'nullable|string',
            'route' => 'nullable|string',
            'status' => 'nullable|string',
        ])->validate();

        $match = TripMatch::create($data);

        return response()->json([
            'message' => 'Coincidencia creada.',
            'data' => $match,
        ], 201);
    }

    public function createAlert(Request $request)
    {
        $data = Validator::make($request->all(), [
            'student_profile_id' => 'nullable|exists:student_profiles,id',
            'type' => 'required|string',
            'severity' => 'nullable|string',
            'message' => 'required|string',
            'active' => 'nullable|boolean',
            'location' => 'nullable|string',
        ])->validate();

        $alert = SafetyAlert::create([
            'student_profile_id' => $data['student_profile_id'] ?? null,
            'type' => $data['type'],
            'severity' => $data['severity'] ?? 'media',
            'message' => $data['message'],
            'active' => $data['active'] ?? true,
            'location' => $data['location'] ?? 'zona-actual',
        ]);

        return response()->json([
            'message' => 'Alerta registrada.',
            'data' => $alert,
        ], 201);
    }

    public function dashboard()
    {
        $trustAverage = (float) (TrustLedger::avg('score_delta') ?? 0);

        return response()->json([
            'stats' => [
                'students' => StudentProfile::count(),
                'trips' => TravelOffer::count(),
                'matches' => TripMatch::count(),
                'alerts' => SafetyAlert::count(),
                'trust_score_avg' => round($trustAverage, 2),
            ],
            'recent_alerts' => SafetyAlert::latest()->limit(5)->get(),
            'recent_trips' => TravelOffer::latest()->limit(5)->get(),
        ]);
    }
}
