"use client";

import { requestDB } from "@/services/axios";
import type { Game, Tag } from "@/type/models";
import { useEffect, useState } from "react";

export default function MasterPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [newGameName, setNewGameName] = useState("");
    const [newTagName, setNewTagName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [gamesRes, tagsRes] = await Promise.all([
                requestDB("game", "readAllGames"),
                requestDB("tag", "readTags"),
            ]);
            if (gamesRes.success) setGames(gamesRes.data);
            if (tagsRes.success) setTags(tagsRes.data);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGame = async () => {
        const name = newGameName.trim();
        if (!name) return;
        const res = await requestDB("game", "createGame", { name });
        if (res.success) {
            setNewGameName("");
            fetchAll();
        } else {
            alert("追加に失敗しました");
        }
    };

    const handleDeleteGame = async (id: number) => {
        if (!confirm("このゲームを削除しますか？")) return;
        const res = await requestDB("game", "deleteGame", { id });
        if (res.success) {
            fetchAll();
        } else {
            alert("削除に失敗しました");
        }
    };

    const handleSetDefault = async (id: number) => {
        const res = await requestDB("game", "setDefaultGame", { id });
        if (res.success) {
            fetchAll();
        } else {
            alert("デフォルト設定に失敗しました");
        }
    };

    const handleAddTag = async () => {
        const name = newTagName.trim();
        if (!name) return;
        const res = await requestDB("tag", "createTag", { name });
        if (res.success) {
            setNewTagName("");
            fetchAll();
        } else {
            alert("追加に失敗しました");
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (!confirm("このタグを削除しますか？")) return;
        const res = await requestDB("tag", "deleteTag", { id });
        if (res.success) {
            fetchAll();
        } else {
            alert("削除に失敗しました");
        }
    };

    if (loading) return <div className="p-admin-master__loading">読み込み中...</div>;

    return (
        <div className="p-admin-master">
            <h2 className="p-admin-master__title">マスターデータ管理</h2>

            <div className="p-admin-master__columns">
                {/* ゲーム管理 */}
                <section className="p-admin-master__section">
                    <h3 className="p-admin-master__section-title">ゲーム一覧</h3>
                    <ul className="p-admin-master__list">
                        {games.map((g) => (
                            <li key={g.id} className="p-admin-master__item">
                                <span className="p-admin-master__item-name">{g.name}</span>
                                <div className="p-admin-master__item-actions">
                                    {g.isDefault ? (
                                        <span className="p-admin-master__badge">デフォルト</span>
                                    ) : (
                                        <button
                                            className="p-admin-master__btn -default"
                                            onClick={() => handleSetDefault(g.id)}
                                        >
                                            デフォルトにする
                                        </button>
                                    )}
                                    <button
                                        className="p-admin-master__btn -delete"
                                        onClick={() => handleDeleteGame(g.id)}
                                    >
                                        削除
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="p-admin-master__add-row">
                        <input
                            className="p-admin-master__input"
                            type="text"
                            value={newGameName}
                            onChange={(e) => setNewGameName(e.target.value)}
                            placeholder="ゲーム名を入力"
                        />
                        <button className="p-admin-master__btn -add" onClick={handleAddGame}>
                            追加
                        </button>
                    </div>
                </section>

                {/* タグ管理 */}
                <section className="p-admin-master__section">
                    <h3 className="p-admin-master__section-title">タグ一覧</h3>
                    <ul className="p-admin-master__list">
                        {tags.map((t) => (
                            <li key={t.id} className="p-admin-master__item">
                                <span className="p-admin-master__item-name">{t.name}</span>
                                <button
                                    className="p-admin-master__btn -delete"
                                    onClick={() => handleDeleteTag(t.id)}
                                >
                                    削除
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="p-admin-master__add-row">
                        <input
                            className="p-admin-master__input"
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="タグ名を入力"
                        />
                        <button className="p-admin-master__btn -add" onClick={handleAddTag}>
                            追加
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
