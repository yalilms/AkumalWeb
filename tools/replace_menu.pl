use strict;
use warnings;
use File::Basename;

my $file = $ARGV[0] or die "Usage: perl replace_menu.pl <file.html>\n";

# Detect link prefix based on directory
my $dir = dirname($file);
$dir =~ s{.*/}{};  # keep only last component when given a path like pages/foo.html

my ($lp, $ip);  # link prefix for pages, index prefix
if ($dir eq 'pages') {
    $lp = '';           # same folder
    $ip = '../';
} elsif ($dir eq 'blog') {
    $lp = '../pages/';
    $ip = '../';
} else {
    $lp = 'pages/';    # root file
    $ip = '';
}

my $desktop = "<ul class=\"nav-menu-main\">
                                    <li class=\"menu-item\">
                                        <a href=\"${ip}index.html\" class=\"item-link link text-caption\">
                                            <span>01 /</span>INICIO</a>
                                    </li>
                                    <li class=\"menu-item\">
                                        <a href=\"${lp}nosotros.html\" class=\"item-link link text-caption\">
                                            <span>02 /</span>SOBRE NOSOTROS</a>
                                    </li>
                                    <li class=\"menu-item\">
                                        <a href=\"${lp}contacto.html\" class=\"item-link link text-caption\">
                                            <span>03 /</span>COTIZA ONLINE</a>
                                    </li>
                                    <li class=\"menu-item\">
                                        <a href=\"${lp}blog.html\" class=\"item-link link text-caption\">
                                            <span>04 /</span>NOTICIAS</a>
                                    </li>
                                    <li class=\"menu-item\">
                                        <a href=\"#\" class=\"item-link link text-caption\">
                                            <span>05 /</span>ÚNETE AL EQUIPO</a>
                                    </li>
                                </ul>";

my $mobile = "<ul class=\"mb-menu-list\">
                                <li>
                                    <a href=\"${ip}index.html\" class=\"mb-menu-link text-display-1\">
                                        <span class=\"text\">Inicio</span>
                                    </a>
                                </li>
                                <li>
                                    <a href=\"${lp}nosotros.html\" class=\"mb-menu-link text-display-1\">
                                        <span class=\"text\">Sobre Nosotros</span>
                                    </a>
                                </li>
                                <li>
                                    <a href=\"${lp}contacto.html\" class=\"mb-menu-link text-display-1\">
                                        <span class=\"text\">Cotiza Online</span>
                                    </a>
                                </li>
                                <li>
                                    <a href=\"${lp}blog.html\" class=\"mb-menu-link text-display-1\">
                                        <span class=\"text\">Noticias</span>
                                    </a>
                                </li>
                                <li>
                                    <a href=\"#\" class=\"mb-menu-link text-display-1\">
                                        <span class=\"text\">Únete al Equipo</span>
                                    </a>
                                </li>
                            </ul>";

my $footer = "<ul class=\"footer-menu-list mb-sm-0\">
                                <li>
                                    <a href=\"${ip}index.html\" class=\"link letter-space--2 h5\">Inicio</a>
                                </li>
                                <li>
                                    <a href=\"${lp}nosotros.html\" class=\"link letter-space--2 h5\">Sobre Nosotros</a>
                                </li>
                                <li>
                                    <a href=\"${lp}contacto.html\" class=\"link letter-space--2 h5\">Cotiza Online</a>
                                </li>
                                <li>
                                    <a href=\"${lp}blog.html\" class=\"link letter-space--2 h5\">Noticias</a>
                                </li>
                                <li>
                                    <a href=\"#\" class=\"link letter-space--2 h5\">Únete al Equipo</a>
                                </li>
                            </ul>";

local $/;
open my $fh, "<", $file or die "Cannot open $file: $!";
my $content = <$fh>;
close $fh;

$content =~ s/<ul class="nav-menu-main">.*?<\/ul>/$desktop/gs;
$content =~ s/<ul class="mb-menu-list">.*?<\/ul>/$mobile/gs;
$content =~ s/<ul class="footer-menu-list mb-sm-0">.*?<\/ul>/$footer/gs;

open my $out, ">", $file or die "Cannot write $file: $!";
print $out $content;
close $out;

print "✓ $file\n";
