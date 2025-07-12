class Question {
  final String id;
  final String title;
  final String content;
  final List<String> tags;
  final String authorId;
  final String authorName;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int answerCount;
  final int voteCount;
  final bool isAccepted;
  final List<String> voters;

  Question({
    required this.id,
    required this.title,
    required this.content,
    required this.tags,
    required this.authorId,
    required this.authorName,
    required this.createdAt,
    required this.updatedAt,
    this.answerCount = 0,
    this.voteCount = 0,
    this.isAccepted = false,
    this.voters = const [],
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      tags: List<String>.from(json['tags'] ?? []),
      authorId: json['authorId'] ?? '',
      authorName: json['authorName'] ?? '',
      createdAt:
          DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt:
          DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      answerCount: json['answerCount'] ?? 0,
      voteCount: json['voteCount'] ?? 0,
      isAccepted: json['isAccepted'] ?? false,
      voters: List<String>.from(json['voters'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'tags': tags,
      'authorId': authorId,
      'authorName': authorName,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'answerCount': answerCount,
      'voteCount': voteCount,
      'isAccepted': isAccepted,
      'voters': voters,
    };
  }

  Question copyWith({
    String? id,
    String? title,
    String? content,
    List<String>? tags,
    String? authorId,
    String? authorName,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? answerCount,
    int? voteCount,
    bool? isAccepted,
    List<String>? voters,
  }) {
    return Question(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      tags: tags ?? this.tags,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      answerCount: answerCount ?? this.answerCount,
      voteCount: voteCount ?? this.voteCount,
      isAccepted: isAccepted ?? this.isAccepted,
      voters: voters ?? this.voters,
    );
  }
}
