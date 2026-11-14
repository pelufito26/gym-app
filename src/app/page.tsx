// Placeholder del Slice 0. El login y las áreas /admin y /alumno llegan en el bloque 5.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">Gimnasio</h1>
      <p className="text-muted-foreground">
        Reservá tus clases y seguí tu plan. Próximamente vas a poder ingresar
        desde acá.
      </p>
    </main>
  );
}
