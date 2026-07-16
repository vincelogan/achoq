import { useState } from "react";
import { toast } from "sonner";
import { Flag, Loader2, MessageSquare, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

function timeAgo(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/**
 * Thread de comentários da enquete. Comentar exige apelido do ranking
 * (pedido inline na primeira vez).
 */
export default function CommentsSection({ marketId }: { marketId: number }) {
  const fingerprint = useFingerprint();
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [needsNickname, setNeedsNickname] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.comments.list.useInfiniteQuery(
      { marketId, limit: 20 },
      { getNextPageParam: (last) => last.nextCursor ?? undefined }
    );

  const { data: myPos } = trpc.ranking.myPosition.useQuery({ fingerprint }, { enabled: !!fingerprint });
  const hasNickname = !!myPos?.nickname;

  const invalidate = () => utils.comments.list.invalidate({ marketId, limit: 20 });

  const addMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      setContent("");
      toast.success("Comentário publicado!");
      invalidate();
    },
    onError: (err) => {
      if (err.message.includes("apelido")) {
        setNeedsNickname(true);
      } else {
        toast.error(err.message);
      }
    },
  });

  const nicknameMutation = trpc.ranking.setNickname.useMutation({
    onSuccess: () => {
      toast.success("Apelido salvo! Agora é só comentar.");
      setNeedsNickname(false);
      utils.ranking.myPosition.invalidate({ fingerprint });
    },
    onError: () => toast.error("Apelido inválido."),
  });

  const reportMutation = trpc.comments.report.useMutation({
    onSuccess: (result) => {
      toast.success(result.hidden ? "Comentário denunciado e ocultado para revisão." : "Denúncia registrada. Obrigado!");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const text = content.trim();
    if (text.length < 2) return;
    if (!hasNickname) {
      setNeedsNickname(true);
      return;
    }
    addMutation.mutate({ marketId, fingerprint, content: text });
  };

  const allComments = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-5 h-5 text-brand" />
        <h2 className="font-bold text-foreground">Comentários</h2>
        {allComments.length > 0 && (
          <span className="text-sm text-muted-foreground">({allComments.length})</span>
        )}
      </div>

      {/* Form */}
      <div className="mb-6">
        {needsNickname && !hasNickname ? (
          <div className="bg-muted rounded-xl p-4 border border-border mb-3">
            <p className="text-sm font-medium text-foreground mb-2">Escolha um apelido para comentar</p>
            <div className="flex gap-2">
              <input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Seu apelido público..."
                maxLength={32}
                aria-label="Apelido"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                onKeyDown={(e) => e.key === "Enter" && nicknameInput.trim() && nicknameMutation.mutate({ fingerprint, nickname: nicknameInput.trim() })}
              />
              <button
                onClick={() => nicknameInput.trim() && nicknameMutation.mutate({ fingerprint, nickname: nicknameInput.trim() })}
                disabled={nicknameMutation.isPending}
                className="px-4 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={hasNickname ? `Comente como ${myPos?.nickname}...` : "O que você acha? (vamos pedir um apelido)"}
            maxLength={500}
            rows={2}
            aria-label="Escrever comentário"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!fingerprint || content.trim().length < 2 || addMutation.isPending}
            aria-label="Publicar comentário"
            className="self-end px-4 py-2.5 rounded-lg bg-brand text-brand-foreground hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 text-right">{content.length}/500</p>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Carregando comentários...</span>
        </div>
      ) : allComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Ninguém comentou ainda. Seja a primeira pessoa a opinar por escrito!
        </p>
      ) : (
        <div className="space-y-4">
          {allComments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                {String(comment.displayName).slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{comment.displayName}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
              <button
                onClick={() => reportMutation.mutate({ commentId: comment.id, fingerprint })}
                className="self-start p-1.5 rounded-md text-muted-foreground/60 hover:text-vote-a hover:bg-vote-a/10 transition-colors shrink-0"
                aria-label="Denunciar comentário"
                title="Denunciar"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-2 text-sm font-medium text-brand hover:bg-brand/5 rounded-lg transition-colors"
            >
              {isFetchingNextPage ? "Carregando..." : "Ver mais comentários"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
