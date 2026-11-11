# Dominio y reglas de negocio

> Fuente de verdad en el repo a partir de F0. Origen: planificación v0.3 (2026-11-11). Cambios de reglas se hacen por PR actualizando este archivo y las specs afectadas.

## Alcance MVP
**Dentro:** login por rol (sin autoregistro); ABM de disciplinas, horarios recurrentes, clases, alumnos y planes; membresías con pago manual; saldo derivado y ajustes manuales; panel de vencimientos; grilla/reserva/cancelación del alumno; asistentes y asistencia; auditoría.
**Fuera:** pagos online, lista de espera, notificaciones, app nativa, multi-gimnasio, QR/acceso, rutinas, agenda por profe, planes por disciplina, tope semanal, arrastre de clases, autoregistro, reportes avanzados.

## Actores
- **Admin/Profe** (rol único `ADMIN`): permisos totales.
- **Alumno** (`STUDENT`): cuenta creada por el admin.
- **Sistema**: genera clases desde horarios; estados derivados.

## Reglas de negocio
| ID | Regla |
|---|---|
| RN-01 | Reservar requiere membresía **vigente en la fecha de la clase** y saldo > 0. Pase libre: cualquier disciplina. |
| RN-02 | Una clase admite reservas mientras `confirmadas < cupo`. |
| RN-03 | Un alumno no puede reservar dos veces la misma clase ni dos clases superpuestas. |
| RN-04 | Corte de 10 min (`minutos_corte`): se reserva y cancela hasta 10 min antes del inicio. Cancelar a tiempo libera cupo y devuelve la clase al saldo. |
| RN-05 | Si el admin cancela una clase: reservas → `CANCELADA_GIMNASIO` y la clase se devuelve al saldo (propuesto). |
| RN-06 | No se puede bajar el cupo por debajo de las reservas confirmadas. |
| RN-07 | Estado de membresía derivado: `vigente`, `por_vencer` (≤ 7 días), `vencida`, `sin_clases` (saldo 0). |
| RN-08 | Dar de baja un horario afecta solo clases futuras. |
| RN-09 | Fechas en UTC; presentación en America/Montevideo. |
| RN-10 | Bajas lógicas. |
| RN-11 | Toda escritura admin queda en auditoría. |
| RN-12 | Saldo = `clases_incluidas` + ajustes − reservas `CONFIRMADA`/`ASISTIO`/`AUSENTE` de esa membresía. Derivado. |
| RN-13 | Período de 30 días corridos desde el inicio de la membresía; vence al final del día inicio+29 (Montevideo). Clases no usadas se pierden. |
| RN-14 | La ausencia (no-show) consume clase. |
| RN-15 | Plan 12 y Plan 15 son planes distintos; pozo por período; sin tope semanal (propuesto). |

## Decisiones tomadas
D1 un solo gimnasio (sin `gym_id`) · D2 pase libre con clases por período (12 / 15) · D3 corte de 10 min · D4 alumnos los crea el admin · D5 personalizado = clase normal, sin modelar profes (❓ confirmar interpretación) · D6 admin y profe mismo rol · D7 Plan 12 y 15 distintos · D8 30 días corridos · D9 clases no usadas se pierden · D10 no-show consume clase.

## Abiertas
E anticipación máxima de reserva (propuesto 7 días) · F cupos típicos y clases simultáneas · G renovación anticipada (propuesto: empieza al día siguiente del vencimiento actual; si venció, el día que se toma) · H feriados · I idioma/hosting · J borde exacto del vencimiento.

## Modelo de datos (conceptual)
`settings` (singleton) · `user` · `student_profile` · `discipline` · `plan` · `membership` (copia `clases_incluidas` del plan; **sin solapamiento de períodos por alumno**) · `credit_adjustment` · `class_schedule` · `class_session` · `booking` · `audit_log`.
Invariantes: `UNIQUE(session_id, student_id)` para reservas activas · `UNIQUE(schedule_id, inicio_utc)` · exclusión de rangos de fechas por alumno en `membership` · `CHECK` cupo ≥ 1, clases_incluidas ≥ 1, vencimiento ≥ inicio.

## Casos de uso (índice)
Auth: AUTH01–02 · Admin: A01–A15 · Alumno: S01–S06 · Sistema: SYS01–03. Cada uno tendrá su spec en `docs/specs/`. Orden: Slice 0 (esqueleto/auth) → Slice 1 (grilla) → Slice 2 (alumnos/planes/saldo) → Slice 3 (reservas) → Slice 4 (pulido).
