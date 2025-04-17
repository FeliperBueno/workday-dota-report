<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

const STEAM32_ID = '425817633';
const MATCH_LIMIT = 100_000;
const TIMEZONE = 'America/Sao_Paulo';
const VALID_HOURS = [[8, 12], [14, 17]];

function fetch_json(string $url): array {
    $json = @file_get_contents($url);
    if ($json === false) {
        throw new RuntimeException("Erro ao acessar a URL: $url");
    }
    return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
}

function get_recent_matches(string $account_id, int $limit): array {
    return fetch_json("https://api.opendota.com/api/players/{$account_id}/matches?limit={$limit}");
}

function get_heroes(): array {
    $heroes = fetch_json("https://api.opendota.com/api/heroes");
    return array_column($heroes, 'localized_name', 'id');
}

function get_hero_images(): array {
    $heroes = fetch_json("https://api.opendota.com/api/heroStats");
    $map = [];
    foreach ($heroes as $h) {
        $map[$h['id']] = $h['img'];
    }
    return $map;
}

function is_valid_match_time(int $timestamp): array {
    $date = (new DateTimeImmutable("@$timestamp"))->setTimezone(new DateTimeZone(TIMEZONE));
    $hour = (int)$date->format('G');
    $weekday = (int)$date->format('w');
    $valid = $weekday > 0 && $weekday < 6 &&
        array_reduce(VALID_HOURS, fn($carry, $range) => $carry || ($hour >= $range[0] && $hour < $range[1]), false);
    return [$date, $valid];
}

function get_match_result(array $match): string {
    if (!isset($match['radiant_win'], $match['player_slot'])) return 'Desconhecido';
    $is_radiant = $match['player_slot'] < 128;
    return ($is_radiant === $match['radiant_win']) ? 'Vitória' : 'Derrota';
}

function group_matches_by_day(array $matches): array {
    $days = [];
    foreach ($matches as $match) {
        $dt = $match['local_time'];
        $key = $dt->format('Y-m-d');
        $days[$key][] = $match;
    }
    krsort($days);
    return $days;
}

// EXECUÇÃO
try {
    $heroes = get_heroes();
    $hero_images = get_hero_images();
    $matches = get_recent_matches(STEAM32_ID, MATCH_LIMIT);

    $valid_matches = [];
    $wins = $losses = 0;

    foreach ($matches as $match) {
        [$dt, $is_valid] = is_valid_match_time($match['start_time']);
        if ($is_valid) {
            $match['local_time'] = $dt;
            $valid_matches[] = $match;
            $result = get_match_result($match);
            if ($result === 'Vitória') $wins++;
            elseif ($result === 'Derrota') $losses++;
        }
    }
	
	$total_duration_seconds = array_sum(array_column($valid_matches, 'duration'));
	$total_hours = $total_duration_seconds / 3600;

    $last_match = $valid_matches[0] ?? null;
    $first_match = end($valid_matches);
    reset($valid_matches);

    $by_day = group_matches_by_day($valid_matches);
    $recent_days = array_slice($by_day, 0, 5, true);

    $total_days = count($by_day);
    $avg_per_day = $total_days > 0 ? round(count($valid_matches) / $total_days, 2) : 0;

} catch (Throwable $e) {
    die("Erro: " . htmlspecialchars($e->getMessage()));
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
	<meta name="robots" content="noindex, nofollow">
    <title>Estatísticas Dota</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1c1f2b, #2b2e3a);
            color: #fff;
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
        }

        .container {
            max-width: 900px;
            width: 100%;
            background: #2e3140;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 12px 24px rgba(0,0,0,0.3);
        }

        h1, h2 {
            margin-top: 0;
            color: #fff;
        }

        .stat-boxes {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 16px;
            margin-bottom: 40px;
        }

        .stat-box {
            background: #3a3d4e;
            padding: 20px 5px;
            border-radius: 12px;
            text-align: center;
        }

        .last-match {
            background: #394867;
            border: 2px solid #607ecb;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 40px;
        }
		
		.last-match h2 {
            text-align: left;
        }

        .match-day {
            margin-bottom: 30px;
        }

        .match-entry {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #3a3d4e;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 10px;
        }

        .match-entry img {
            width: 32px;
            height: 32px;
            border-radius: 4px;
        }

        .result-win {
            color: #4caf50;
            font-weight: bold;
        }

        .result-loss {
            color: #f44336;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Estatísticas de Partidas</h1>

        <?php if ($last_match): 
            $hero_name = $heroes[$last_match['hero_id']] ?? 'Desconhecido';
            $hero_img = $hero_images[$last_match['hero_id']] ?? null;
            $hero_img_url = $hero_img ? "https://cdn.dota2.com$hero_img" : null;
            $resultado = get_match_result($last_match);
        ?>
        <div class="last-match">
            <h2>Última partida remunerada</h2>
            <p><strong>Data:</strong> <?= $last_match['local_time']->format('d/m/Y H:i') ?></p>
            <p><strong>Herói:</strong> <?= htmlspecialchars($hero_name) ?></p>
            <p><strong>Resultado:</strong> 
                <span class="<?= $resultado === 'Vitória' ? 'result-win' : 'result-loss' ?>">
                    <?= $resultado ?>
                </span>
            </p>
            <?php if ($hero_img_url): ?>
                <img src="<?= htmlspecialchars($hero_img_url) ?>" alt="<?= htmlspecialchars($hero_name) ?>">
            <?php endif; ?>
        </div>

        <h2>Resumo</h2>
        <div class="stat-boxes">
            <div class="stat-box"><strong>Vitórias</strong><br><span class="result-win"><?= $wins ?></span></div>
            <div class="stat-box"><strong>Derrotas</strong><br><span class="result-loss"><?= $losses ?></span></div>
            <div class="stat-box"><strong>Partidas válidas</strong><br><?= count($valid_matches) ?></div>
            <div class="stat-box"><strong>1ª partida</strong><br><?= $first_match ? $first_match['local_time']->format('d/m/Y') : '-' ?></div>
            <div class="stat-box"><strong>Média por dia</strong><br><?= $avg_per_day ?></div>
			<div class="stat-box"><strong>Tempo jogado</strong><br><?= round($total_hours) ?> horas</div>
        </div>

        <h2>Últimos 5 dias úteis</h2>
        <?php foreach ($recent_days as $day => $day_matches): ?>
            <div class="match-day">
                <h3><?= date('d/m/Y', strtotime($day)) ?> (<?= count($day_matches) ?> partidas)</h3>
                <?php foreach ($day_matches as $match): 
                    $result = get_match_result($match);
                    $hero_name = $heroes[$match['hero_id']] ?? 'Desconhecido';
                    $hero_img = $hero_images[$match['hero_id']] ?? null;
                    $hero_img_url = $hero_img ? "https://cdn.dota2.com$hero_img" : null;
                ?>
                    <div class="match-entry">
                        <?php if ($hero_img_url): ?>
                            <img src="<?= htmlspecialchars($hero_img_url) ?>" alt="<?= htmlspecialchars($hero_name) ?>">
                        <?php endif; ?>
                        <div>
                            <?= $match['local_time']->format('H:i') ?> - 
                            <strong><?= htmlspecialchars($hero_name) ?></strong> - 
                            <span class="<?= $result === 'Vitória' ? 'result-win' : 'result-loss' ?>">
                                <?= $result ?>
                            </span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
        <?php else: ?>
            <p>Nenhuma partida válida encontrada.</p>
        <?php endif; ?>
    </div>
</body>
</html>