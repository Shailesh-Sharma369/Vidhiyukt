// components/intake/ValidationMessage.tsx

export function ValidationMessage({ message }: { message: string }) {
  return (
    <p className="mt-2 text-sm text-red-500">
      {message}
    </p>
  );
}