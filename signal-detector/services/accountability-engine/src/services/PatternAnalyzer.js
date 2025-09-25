class PatternAnalyzer {
  analyze(activities) {
    const patterns = [];

    // Dummy implementation for now
    if (this.isProcrastinating(activities)) {
      patterns.push({
        pattern_type: 'procrastination',
        confidence_score: 0.8,
        supporting_data: JSON.stringify({ message: 'User is likely procrastinating.' })
      });
    }

    if (this.isPerfectionist(activities)) {
      patterns.push({
        pattern_type: 'perfectionism',
        confidence_score: 0.7,
        supporting_data: JSON.stringify({ message: 'User is showing signs of perfectionism.' })
      });
    }

    return patterns;
  }

  isProcrastinating(activities) {
    // Dummy logic: if there are many 'RUÍDO' activities, the user is procrastinating
    const ruidoCount = activities.filter(a => a.classification === 'RUÍDO').length;
    return ruidoCount > 5;
  }

  isPerfectionist(activities) {
    // Dummy logic: if activities take a long time and have high energy, it could be perfectionism
    const longHighEnergyActivities = activities.filter(a => a.duration_minutes > 120 && a.energy_after < 5).length;
    return longHighEnergyActivities > 2;
  }
}

module.exports = PatternAnalyzer;
