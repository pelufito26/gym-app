# UC-S02 · Reservar una clase

- **Actor:** Alumno (y, por UC-A13, Admin en nombre del alumno) · **Prioridad:** P0 · **Slice:** 3
- **Reglas:** RN-01, RN-02, RN-03, RN-04, RN-07, RN-09, RN-12, RN-13, RN-14
- **Depende de:** UC-A02 (clases generadas), UC-A09 (alumno), UC-A10/A11 (plan y membresía)
- **Estado:** borrador — pendiente de aprobación humana

## Contexto y precondiciones
- El alumno está autenticado con rol `STUDENT`, cuenta activa.
- Existe una `ClassSession` en estado `PROGRAMADA`.
- Las membresías de un alumno **no se solapan** (restricción en BD), por lo que para una fecha dada hay a lo sumo una aplicable.

## Definiciones precisas
- **Membresía aplicable**: la del alumno cuyo rango `[inicio, vencimiento]` contiene la **fecha local (America/Montevideo) del inicio de la clase** — no la fecha de hoy. Un alumno que vence el 30 no puede reservar una clase del 2 si no tiene ya otra membresía que cubra el 2.
- **Saldo** (RN-12): `membership.clases_incluidas + Σ credit_adjustment.delta − count(booking de esa membership en CONFIRMADA | ASISTIO | AUSENTE)`.
- **Corte** (RN-04): se permite reservar si `session.inicio_utc − now ≥ cutoffMinutes` (10 min, inclusive). A 9 min 59 s → cerrado.
- **Anticipación máxima** (decisión E, propuesto 7 días): se permite si `session.inicio_utc − now ≤ advanceDays`. ❓ pendiente de confirmar.
- **Superposición**: dos clases se superponen si `A.inicio < B.fin && B.inicio < A.fin`. Clases consecutivas (A.fin = B.inicio) **no** se superponen.

## Flujo principal
1. El alumno elige una clase en la grilla y pulsa "Reservar".
2. El servidor ejecuta, en **una transacción**:
   1. Bloquea la fila de `class_session` (`FOR UPDATE`).
   2. Verifica clase `PROGRAMADA`, corte y anticipación.
   3. Determina y bloquea (`FOR UPDATE`) la membresía aplicable.
   4. Calcula el saldo; exige saldo ≥ 1.
   5. Verifica que no haya reserva activa en la misma clase ni superposición con otras reservas activas del alumno.
   6. Cuenta reservas `CONFIRMADA`; exige `< capacity`.
   7. Inserta `booking(CONFIRMADA, membership_id)`.
3. Responde con la reserva y el cupo/saldo actualizados.

**Orden de bloqueo fijo:** `class_session` → `membership` (evita deadlocks).

## Errores
| Condición | Código | Mensaje (es-UY) |
|---|---|---|
| Clase inexistente | `CLASS_NOT_FOUND` | La clase no existe. |
| Clase cancelada | `CLASS_CANCELLED` | Esta clase fue cancelada. |
| Faltan menos de 10 min o ya empezó | `BOOKING_CLOSED` | Las reservas se cierran 10 minutos antes de la clase. |
| Demasiado anticipada | `TOO_EARLY` | Todavía no se puede reservar esta clase. |
| Sin membresía que cubra la fecha de la clase | `NO_ACTIVE_MEMBERSHIP` | Tu plan no está vigente para esa fecha. |
| Saldo 0 | `NO_CREDITS` | No te quedan clases disponibles en tu plan. |
| Ya reservada | `ALREADY_BOOKED` | Ya tenés reserva en esta clase. |
| Superposición | `SCHEDULE_CONFLICT` | Tenés otra reserva en ese horario. |
| Cupo lleno | `CLASS_FULL` | La clase está completa. |
| Alumno desactivado | `STUDENT_INACTIVE` | Tu cuenta está inactiva. |
| Rol incorrecto | `FORBIDDEN` | No tenés permiso para hacer esto. |

El orden de evaluación de errores es el de esta tabla (de arriba hacia abajo) para que la respuesta sea determinista.

## Criterios de aceptación (Dado / Cuando / Entonces)
- **CA-1** Dado cupo disponible, membresía vigente y saldo ≥ 1, cuando reserva, entonces `booking` queda `CONFIRMADA`, el cupo disponible baja 1 y el saldo baja 1.
- **CA-2** Dado cupo lleno, cuando reserva, entonces `CLASS_FULL` y no se crea reserva ni se consume saldo.
- **CA-3** Dado saldo 0, cuando reserva, entonces `NO_CREDITS`.
- **CA-4** Dada membresía que vence antes de la fecha de la clase y sin otra que la cubra, entonces `NO_ACTIVE_MEMBERSHIP`.
- **CA-5** Dado que el alumno tiene una renovación que empieza el día de la clase, cuando reserva, entonces la reserva se asocia a la **nueva** membresía y consume de **su** saldo.
- **CA-6** Dados `inicio − now` = 10:00 exactos → permitido; = 9:59 → `BOOKING_CLOSED`; clase ya iniciada → `BOOKING_CLOSED`.
- **CA-7** Dada una clase `CANCELADA`, entonces `CLASS_CANCELLED`.
- **CA-8** Dada una reserva activa en la misma clase, entonces `ALREADY_BOOKED` (idempotente: no crea duplicado ni consume saldo extra).
- **CA-9** Dada una reserva activa 19:00–20:00, cuando intenta reservar 19:30–20:30 → `SCHEDULE_CONFLICT`; 20:00–21:00 → permitido.
- **CA-10** **Concurrencia de cupo**: con cupo K y N > K alumnos reservando simultáneamente, exactamente K quedan `CONFIRMADA` y N−K reciben `CLASS_FULL`.
- **CA-11** **Concurrencia de saldo**: un alumno con saldo 1 dispara dos reservas simultáneas a clases distintas → exactamente una `CONFIRMADA` y la otra `NO_CREDITS`.
- **CA-12** Un usuario `ADMIN` o sin sesión no puede usar el endpoint del alumno para sí mismo (`FORBIDDEN`/redirect); un alumno no puede reservar a nombre de otro alumno.
- **CA-13** Alumno desactivado → `STUDENT_INACTIVE`.
- **CA-14** Dos clases en distinta disciplina con la misma membresía: ambas permiten reservar (pase libre) mientras haya saldo.
- **CA-15** Toda reserva exitosa o rechazada por regla de negocio no deja estado parcial (atomicidad: si falla un paso, no hay `booking`).

## Casos borde y de seguridad
- Cambio de horario de verano: Uruguay no lo aplica hoy, pero los tests usan fechas fijadas en UTC para no depender de la zona del servidor (`TZ=UTC` en CI).
- Fecha de vigencia cerca de medianoche (clase 23:30 del último día) → se decide por la fecha local de Montevideo.
- La UI **no** decide: el botón deshabilitado es una ayuda; el servidor revalida todo.
- Reintentos del cliente (doble click) no generan doble reserva (CA-8).
- No exponer en errores datos de otros alumnos (p. ej. quién ocupa los cupos).

## Datos y migraciones afectados
- `booking`: `id, session_id, student_id, membership_id, status, created_at, cancelled_at`; índice único parcial `(session_id, student_id) WHERE status IN ('CONFIRMADA','ASISTIO','AUSENTE')`.
- `membership`: restricción de exclusión por alumno sobre el rango de fechas `[inicio, vencimiento]` (extensión `btree_gist`).
- Índices: `booking(student_id, status)`, `class_session(inicio_utc)`.

## Plan de pruebas
- **Unit (`domain`)**: función pura `canBook({ session, membership, balance, existingBookings, now, settings })` que devuelve `Ok` o el error de la tabla; tests para CA-1…CA-9, CA-13 con reloj fake; propiedad: el orden de errores es el de la tabla.
- **Integración (Postgres real)**: CA-10 y CA-11 con concurrencia real (N conexiones en paralelo); CA-5 y CA-15; verificación de la restricción de exclusión de membresías y del índice único.
- **E2E (Playwright)**: alumno reserva desde la grilla móvil (CA-1), ve cupo y saldo actualizados; clase llena deshabilitada (CA-2); intento directo al endpoint con clase cerrada (CA-6) → mensaje en español; alumno no accede a rutas admin (CA-12).

## Preguntas abiertas
- ❓ E: anticipación máxima de reserva (propuesto 7 días).
- ❓ J: borde exacto del vencimiento (propuesto: último día válido = inicio + 29, fin del día en Montevideo).
- ❓ F: ¿puede haber clases simultáneas de distintas disciplinas? (afecta solo la grilla, no esta regla).
