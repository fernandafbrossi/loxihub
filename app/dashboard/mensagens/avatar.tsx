export function PersonagemAvatar({ nome, foto_url, size = 36 }: { nome: string; foto_url: string | null; size?: number }) {
  return foto_url ? (
    <div
      className="rounded-full flex-shrink-0"
      style={{ width: size, height: size, backgroundImage: `url(${foto_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center font-medium flex-shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: 'linear-gradient(135deg, #800020, #5C0018)',
        color: 'var(--primary-foreground)',
      }}
    >
      {nome[0]?.toUpperCase()}
    </div>
  )
}
